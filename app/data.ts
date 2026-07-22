export type BikeStatus = "normal" | "progress" | "full";

export const bikeFiles = [
  { id:"z900rs-black", maker:"KAWASAKI", model:"Z900RS", year:"2022", cc:"948cc", style:"ストリートカスタム", status:"full" as BikeStatus, sale:false, sold:false, views:1842, owner:"SHIN", customPoint:"黒を基調に、足まわりとマフラーを中心に仕上げています。" },
  { id:"cbx400f-red", maker:"HONDA", model:"CBX400F", year:"1982", cc:"399cc", style:"旧車カスタム", status:"progress" as BikeStatus, sale:true, sold:false, views:3240, owner:"TOMO", customPoint:"当時の雰囲気を残しながら、少しずつ自分好みに変更中です。" },
  { id:"sr400-cafe", maker:"YAMAHA", model:"SR400", year:"2017", cc:"399cc", style:"カフェレーサー", status:"full" as BikeStatus, sale:false, sold:false, views:976, owner:"KAZU", customPoint:"細身のシルエットと低いハンドル位置にこだわりました。" },
  { id:"gs400-blue", maker:"SUZUKI", model:"GS400", year:"1978", cc:"398cc", style:"旧車カスタム", status:"full" as BikeStatus, sale:false, sold:true, views:4115, owner:"RYU", customPoint:"外装と足まわりのバランスを重視した一台です。" },
  { id:"sportster-normal", maker:"HARLEY-DAVIDSON", model:"Sportster", year:"2021", cc:"1202cc", style:"ノーマル", status:"normal" as BikeStatus, sale:false, sold:false, views:621, owner:"KEN", customPoint:"購入時の状態を記録。これから少しずつボバー仕様にしていく予定です。" },
  { id:"monster-street", maker:"DUCATI", model:"Monster", year:"2020", cc:"821cc", style:"ネイキッド", status:"progress" as BikeStatus, sale:false, sold:false, views:718, owner:"MOTO", customPoint:"まずはミラーとフェンダーレスから。今後マフラーを変更予定です。" },
];

export const statusLabel: Record<BikeStatus,string> = {
  normal:"NORMAL",
  progress:"CUSTOM IN PROGRESS",
  full:"FULL CUSTOM",
};
