import { AbstractControl, ValidationErrors } from '@angular/forms';
export function cnpjValidator(control:AbstractControl):ValidationErrors|null {
  const text=String(control.value||'').trim();if(!text)return null;
  const value=text.toUpperCase().replace(/[.\/\- ]/g,'');
  if(!/^[A-Z0-9]{12}\d{2}$/.test(value)||new Set(value).size===1)return {cnpj:true};
  for(let length=12;length<=13;length++){
    let sum=0;for(let i=0;i<length;i++)sum+=(value.charCodeAt(i)-48)*((length-1-i)%8+2);
    const digit=sum%11<2?0:11-sum%11;if(Number(value[length])!==digit)return {cnpj:true};
  }
  return null;
}
