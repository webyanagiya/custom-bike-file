"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { bikeFiles, statusLabel, BikeStatus } from "./data";
import { createClient } from "../lib/supabase/client";
import { normalizeForMatch } from "../lib/textMatch";

export function BikeSearchGrid({bikes=bikeFiles,initialCc="",initialKeyword="",initialStatus="",modelOptions=[]}:{bikes?:((typeof bikeFiles)[number]&{thumbnailUrl?:string})[],initialCc?:string,initialKeyword?:string,initialStatus?:string,modelOptions?:string[]}){
  const [cc,setCc]=useState(initialCc);
  const [keyword,setKeyword]=useState(initialKeyword);
  const [status,setStatus]=useState(initialStatus);
  const suggestions=useMemo(()=>{
    if(!keyword) return [];
    const q=normalizeForMatch(keyword);
    return modelOptions.filter(m=>normalizeForMatch(m).includes(q)).slice(0,8);
  },[modelOptions,keyword]);
  const filtered=useMemo(()=>bikes.filter(b=>{
    const ccNum=parseInt(b.cc);
    const ccOk=!cc
      ||(cc==="50"&&ccNum<=50)
      ||(cc==="125"&&ccNum>=51&&ccNum<=125)
      ||(cc==="250"&&ccNum>=126&&ccNum<=250)
      ||(cc==="400"&&ccNum>=251&&ccNum<=400)
      ||(cc==="750"&&ccNum>=401&&ccNum<=750)
      ||(cc==="751plus"&&ccNum>=751);
    return ccOk&&(!status||b.status===status)&&(!keyword||normalizeForMatch(`${b.maker} ${b.model} ${b.style}`).includes(normalizeForMatch(keyword)));
  }),[bikes,cc,keyword,status]);
  return <>
    <div className="catalogSearch">
      <input value={keyword} onChange={e=>setKeyword(e.target.value)} list="modelSuggestions" placeholder="車名で検索（例：CB、ZRX、ゼファー）" autoComplete="off" />
      <datalist id="modelSuggestions">{suggestions.map(m=><option key={m} value={m}/>)}</datalist>
      <select value={cc} onChange={e=>setCc(e.target.value)}><option value="">すべての排気量</option><option value="50">50cc以下</option><option value="125">51cc～125cc</option><option value="250">126cc～250cc</option><option value="400">251cc～400cc</option><option value="750">401cc～750cc</option><option value="751plus">751cc以上</option></select>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">すべての状態</option><option value="normal">ノーマル車</option><option value="progress">カスタム途中</option><option value="full">フルカスタム</option></select>
    </div>
    <p className="resultCount">{filtered.length}台見つかりました</p>
    <div className="grid">{filtered.map((b,i)=><BikeCard key={b.id} bike={b} index={i} thumbnailUrl={b.thumbnailUrl}/>)}</div>
  </>;
}

export function BikeCard({bike,index=0,thumbnailUrl}:{bike:(typeof bikeFiles)[number],index?:number,thumbnailUrl?:string}){
  return <a href={`/bikes/${bike.id}`} className="card">
    <div className={`photo ${thumbnailUrl?"has-photo":"no-photo"}`}>
      {thumbnailUrl?<img src={thumbnailUrl} alt="" className="realPhoto"/>:<div className="noImageLabel">NO IMAGE</div>}
      <span className={`statusTag ${bike.status}`}>{statusLabel[bike.status]}</span>
      {(bike.sale||bike.sold)&&<div className="cornerTags">{bike.sale&&<b className="saleTag">売ります</b>}{bike.sold&&<b className="soldTag">SOLD</b>}</div>}
    </div>
    <div className="cardBody"><p>{bike.maker}</p><h3>{bike.model}</h3></div>
  </a>;
}

export function MyBikeCard({bike,index=0}:{bike:(typeof bikeFiles)[number],index?:number}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);

  async function handleDelete(){
    if(!window.confirm(`「${bike.model}」を削除します。この操作は取り消せません。よろしいですか？`)) return;
    setBusy(true);
    const supabase=createClient();
    const {data:photos}=await supabase.from("bike_photos").select("storage_path").eq("bike_id",bike.id);
    const paths=(photos??[]).map((p:any)=>p.storage_path as string);
    if(paths.length>0) await supabase.storage.from("bike-photos").remove(paths);
    await supabase.from("bikes").delete().eq("id",bike.id);
    setBusy(false);
    router.refresh();
  }

  async function handleToggleSold(){
    setBusy(true);
    const supabase=createClient();
    await supabase.from("bikes").update({is_sold:!bike.sold}).eq("id",bike.id);
    setBusy(false);
    router.refresh();
  }

  return <div>
    <BikeCard bike={bike} index={index}/>
    <div className="manageButtons">
      <button type="button" disabled={busy} onClick={()=>router.push(`/mypage/${bike.id}/edit`)}>編集</button>
      <button type="button" disabled={busy} onClick={()=>router.push(`/mypage/${bike.id}/sell`)}>売ります設定</button>
      <button type="button" disabled={busy} onClick={handleToggleSold}>{bike.sold?"SOLD解除":"SOLD変更"}</button>
      <button type="button" disabled={busy} onClick={handleDelete}>削除</button>
    </div>
  </div>;
}

export function SignOutButton(){
  const router=useRouter();
  async function handleSignOut(){
    const supabase=createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return <button type="button" onClick={handleSignOut}>ログアウト</button>;
}

export function FavoriteButton({id}:{id:string}){
  const [fav,setFav]=useState(false);
  useEffect(()=>setFav(JSON.parse(localStorage.getItem("cbf-favorites")||"[]").includes(id)),[id]);
  function toggle(){const old:string[]=JSON.parse(localStorage.getItem("cbf-favorites")||"[]");const next=old.includes(id)?old.filter(x=>x!==id):[...old,id];localStorage.setItem("cbf-favorites",JSON.stringify(next));setFav(!fav)}
  return <button className="favoriteButton" onClick={toggle}>{fav?"♥ お気に入り済み":"♡ お気に入り"}</button>;
}

export function PhotoGallery({photos}:{photos:string[]}){
  const [selected,setSelected]=useState(0);
  const [lightboxOpen,setLightboxOpen]=useState(false);
  const touchStartX=useRef<number|null>(null);

  function go(delta:number){
    setSelected(current=>(current+delta+photos.length)%photos.length);
  }
  function handleTouchStart(e:React.TouchEvent){
    touchStartX.current=e.touches[0].clientX;
  }
  function handleTouchEnd(e:React.TouchEvent){
    if(touchStartX.current===null) return;
    const deltaX=e.changedTouches[0].clientX-touchStartX.current;
    if(Math.abs(deltaX)>40) go(deltaX<0?1:-1);
    touchStartX.current=null;
  }

  useEffect(()=>{
    if(!lightboxOpen) return;
    function handleKey(e:KeyboardEvent){
      if(e.key==="Escape") setLightboxOpen(false);
      if(e.key==="ArrowRight") go(1);
      if(e.key==="ArrowLeft") go(-1);
    }
    window.addEventListener("keydown",handleKey);
    return ()=>window.removeEventListener("keydown",handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[lightboxOpen,photos.length]);

  if(photos.length===0){
    return <div className="gallery"><div className="detailMainPhoto"><em>写真はまだありません</em></div></div>;
  }

  return <>
    <div className="gallery">
      <div className="detailMainPhoto photo has-photo" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <img src={photos[selected]} alt={`写真${selected+1}`} className="realPhoto" onClick={()=>setLightboxOpen(true)}/>
        {photos.length>1&&<>
          <button type="button" aria-label="前の写真" className="galleryArrow galleryArrowPrev" onClick={()=>go(-1)}>‹</button>
          <button type="button" aria-label="次の写真" className="galleryArrow galleryArrowNext" onClick={()=>go(1)}>›</button>
        </>}
      </div>
      <div className="thumbGrid">{photos.map((url,i)=><button key={url} aria-label={`写真${i+1}`} className={`thumb ${selected===i?"active":""}`} onClick={()=>setSelected(i)}><img src={url} alt="" className="realPhoto"/></button>)}</div>
    </div>
    {lightboxOpen&&<div className="lightbox" onClick={()=>setLightboxOpen(false)} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <button type="button" aria-label="閉じる" className="lightboxClose" onClick={()=>setLightboxOpen(false)}>×</button>
      <img src={photos[selected]} alt={`写真${selected+1}`} className="lightboxImage" onClick={e=>e.stopPropagation()}/>
      {photos.length>1&&<>
        <button type="button" aria-label="前の写真" className="galleryArrow galleryArrowPrev" onClick={e=>{e.stopPropagation();go(-1);}}>‹</button>
        <button type="button" aria-label="次の写真" className="galleryArrow galleryArrowNext" onClick={e=>{e.stopPropagation();go(1);}}>›</button>
      </>}
    </div>}
  </>;
}

export function BikeStatusFields({value,onChange}:{value:BikeStatus,onChange:(status:BikeStatus)=>void}){
 return <fieldset className="statusChoice"><legend>現在の状態</legend>{(["normal","progress","full"] as BikeStatus[]).map(x=><label key={x}><input type="radio" name="bikeStatus" checked={value===x} onChange={()=>onChange(x)}/><span>{x==="normal"?"ノーマル車":x==="progress"?"カスタム途中":"フルカスタム"}</span></label>)}<p>ノーマル車や、これからカスタムしていく方も大歓迎です。</p></fieldset>
}

export type ShopSummary = { id:string; name:string; prefecture:string|null; specialty:string|null; photo_url:string|null };

export function ShopSearchGrid({shops}:{shops:ShopSummary[]}){
  const [prefecture,setPrefecture]=useState("");
  const filtered=useMemo(()=>shops.filter(s=>!prefecture||s.prefecture===prefecture),[shops,prefecture]);
  return <>
    <div className="catalogSearch">
      <select value={prefecture} onChange={e=>setPrefecture(e.target.value)}><option value="">すべての都道府県</option>{[...new Set(shops.map(s=>s.prefecture).filter((p):p is string=>Boolean(p)))].map(p=><option key={p}>{p}</option>)}</select>
    </div>
    <p className="resultCount">{filtered.length}件見つかりました</p>
    <div className="shopList">{filtered.map(s=><ShopCard key={s.id} shop={s}/>)}</div>
  </>;
}

export function ShopCard({shop}:{shop:ShopSummary}){
  return <article className="shopCard">
    <a href={`/shops/${shop.id}`} className="shopPhoto">{shop.photo_url&&<img src={shop.photo_url} alt="" className="realPhoto"/>}</a>
    <div><small>{shop.prefecture}</small><h2><a href={`/shops/${shop.id}`}>{shop.name}</a></h2><p>{shop.specialty}</p><a className="secondary buttonLink" href={`/shops/${shop.id}`}>ショップを見る</a></div>
  </article>;
}
