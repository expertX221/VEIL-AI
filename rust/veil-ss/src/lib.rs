//! VEIL//AI Rust/WASM key-sharing core.
//!
//! This implementation demonstrates Shamir (2,3) over GF(2^8), using
//! p(x) = secret_byte + random_coefficient * x.
//! Coefficients come from JavaScript's crypto.getRandomValues() CSPRNG.
//! It is NOT constant-time or audited; never use directly to protect
//! high-value production credentials without independent review.
use wasm_bindgen::prelude::*;

fn gf_mul(mut a: u8, mut b: u8) -> u8 {
    let mut product = 0u8;
    for _ in 0..8 {
        if b & 1 != 0 { product ^= a; }
        let high = (a & 0x80) != 0;
        a = a.wrapping_shl(1);
        if high { a ^= 0x1b; }
        b >>= 1;
    }
    product
}
fn gf_pow(mut value: u8, mut exp: u16) -> u8 {
    let mut result = 1u8;
    while exp > 0 {
        if exp & 1 == 1 { result = gf_mul(result, value); }
        value = gf_mul(value, value);
        exp >>= 1;
    }
    result
}
fn gf_div(a: u8, b: u8) -> Result<u8, &'static str> {
    if b == 0 { return Err("GF(256) division by zero"); }
    Ok(gf_mul(a, gf_pow(b, 254)))
}
fn split_raw(secret: &[u8], coefficients: &[u8]) -> Result<Vec<u8>, &'static str> {
    if secret.len() != 32 || coefficients.len() != 32 { return Err("Require 32-byte key and 32 independent random bytes"); }
    let mut output = Vec::with_capacity(99);
    for x in 1u8..=3u8 {
        output.push(x);
        for byte in 0..32 { output.push(secret[byte] ^ gf_mul(coefficients[byte], x)); }
    }
    Ok(output)
}
fn recover_raw(a: &[u8], b: &[u8]) -> Result<Vec<u8>, &'static str> {
    if a.len()!=33 || b.len()!=33 || a[0]==0 || b[0]==0 || a[0]==b[0] {return Err("Require two distinct 33-byte shares");}
    let (x1,x2)=(a[0],b[0]);
    let denom=x1^x2;
    let l1=gf_div(x2,denom)?;
    let l2=gf_div(x1,denom)?;
    let mut result=vec![0u8;32];
    for i in 0..32 {result[i]=gf_mul(a[i+1],l1)^gf_mul(b[i+1],l2)}
    Ok(result)
}

#[wasm_bindgen]
pub fn split_2_of_3(secret: &[u8], random_coefficients: &[u8]) -> Result<Vec<u8>, JsValue> {
    split_raw(secret,random_coefficients).map_err(JsValue::from_str)
}
#[wasm_bindgen]
pub fn recover_2_of_3(a: &[u8], b: &[u8]) -> Result<Vec<u8>, JsValue> {
    recover_raw(a,b).map_err(JsValue::from_str)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn field_multiplication_reference() { assert_eq!(gf_mul(0x57,0x83),0xc1); }
    #[test]
    fn recover_all_pairs() {
        let key = [42u8;32];let coeffs = [37u8;32];let data=split_raw(&key,&coeffs).unwrap();
        for (x,y) in [(0,1),(0,2),(1,2)] {
            let result=recover_raw(&data[x*33..(x+1)*33],&data[y*33..(y+1)*33]).unwrap();
            assert_eq!(result,key);
        }
    }
    #[test]
    fn reject_duplicate_shares(){let key=[1u8;32];let coeffs=[2u8;32];let data=split_raw(&key,&coeffs).unwrap();assert!(recover_raw(&data[..33],&data[..33]).is_err());}
}
