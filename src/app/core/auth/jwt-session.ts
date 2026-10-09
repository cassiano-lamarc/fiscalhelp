import { Injectable } from '@angular/core';

@Injectable({providedIn:'root'})
export class JwtSession {
  private readonly tokenKey = 'fiscalhelp.jwt';
  private readonly proofKey = 'fiscalhelp.login-proof';
  accessToken(): string | null {
    try {
      const session = JSON.parse(sessionStorage.getItem(this.tokenKey) || 'null');
      if (session && Date.parse(session.expiresAtUtc) > Date.now()) return session.accessToken;
    } catch {}
    this.clear();
    return null;
  }
  save(accessToken:string, expiresAtUtc:string) {
    sessionStorage.setItem(this.tokenKey, JSON.stringify({accessToken,expiresAtUtc}));
  }
  clear() { sessionStorage.removeItem(this.tokenKey); }
  verifier() { return sessionStorage.getItem(this.proofKey); }
  clearProof() { sessionStorage.removeItem(this.proofKey); }
  async beginProof() {
    const encode = (bytes:Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
    const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
    sessionStorage.setItem(this.proofKey, verifier);
    return encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  }
}
