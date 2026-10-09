import { Component, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { ApiService, Quote } from '../../core/http/api.service';
import { emissionLabel, absoluteEmission } from '../../shared/emission-time';

export function portuguesePaginator(){
  const intl=new MatPaginatorIntl();intl.itemsPerPageLabel='Orçamentos por página:';intl.nextPageLabel='Próxima página';intl.previousPageLabel='Página anterior';intl.firstPageLabel='Primeira página';intl.lastPageLabel='Última página';
  intl.getRangeLabel=(page,size,length)=>!length?'0 de 0':`${page*size+1} – ${Math.min((page+1)*size,length)} de ${length}`;return intl;
}
@Component({selector:'app-quote-list',imports:[RouterLink,CurrencyPipe,MatButtonModule,MatPaginatorModule],providers:[{provide:MatPaginatorIntl,useFactory:portuguesePaginator}],templateUrl:'./quote-list.html',styleUrl:'./quote-list.scss'})
export class QuoteList implements OnInit,OnDestroy {
  api=inject(ApiService);quotes=signal<Quote[]>([]);count=signal(0);busy=signal(true);pageIndex=signal(0);pageSize=signal(10);now=signal(new Date());failed=signal(false);
  @ViewChild(MatPaginator) paginator?:MatPaginator;
  private request?:Subscription;private timer?:ReturnType<typeof setInterval>;
  private resume=()=>{if(document.visibilityState==='visible'){this.now.set(new Date());void this.api.loadSession();this.load();}};
  ngOnInit(){this.load();this.timer=setInterval(()=>this.now.set(new Date()),60000);document.addEventListener('visibilitychange',this.resume);}
  load(index=this.pageIndex(),size=this.pageSize()){
    this.request?.unsubscribe();this.busy.set(true);this.failed.set(false);
    this.request=this.api.listQuotes(index,size).subscribe({next:r=>{this.quotes.set(r.items);this.count.set(r.totalCount);this.pageIndex.set(r.page-1);this.pageSize.set(r.pageSize);this.busy.set(false);},error:()=>{this.busy.set(false);this.failed.set(true);if(this.paginator){this.paginator.pageIndex=this.pageIndex();this.paginator.pageSize=this.pageSize();}}});
  }
  changePage(event:PageEvent){this.load(event.pageSize!==this.pageSize()?0:event.pageIndex,event.pageSize);}
  label(q:Quote){return emissionLabel(q.issuedAtUtc,q.issueDate,this.now());}
  absolute(q:Quote){return absoluteEmission(q.issuedAtUtc,q.issueDate);}
  async download(q:Quote){try{const blob=await this.api.pdf(q.id);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='orcamento-'+q.number+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch{this.api.error.set('Não foi possível gerar o PDF. Tente novamente.');}}
  ngOnDestroy(){this.request?.unsubscribe();if(this.timer)clearInterval(this.timer);document.removeEventListener('visibilitychange',this.resume);}
}
