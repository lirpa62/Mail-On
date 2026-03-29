export function Subscription() {
  return (
    <div className="flex justify-center items-center w-full h-[calc(30vh*1.5)] pt-4 pb-5 bg-gradient-to-b from-white-100/50 to-sky-200/50 ">
      <div className="w-[90%] text-center text-[calc(3rem*0.55)] text-emerald-500/85 leading-10">
        <h1>
          부경대 컴퓨터•인공지능공학부 <br />
          취업게시물을 <br />
          매일 오전 9시 ~ 오후 9시 <br />
          메일로 보내드릴게요!
        </h1>
        <p className="text-neutral-400 text-[calc(2rem*0.5)] font-normal mt-[2.5rem]">
          새로운 취업게시물이 없으면 메일이 발송되지 않아요!
        </p>
      </div>
    </div>
  );
}
