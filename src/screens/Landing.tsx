import { Logo, LadleIcon } from '../components/visuals';

/** 로그인 전 첫 화면: 장독대 소개 (애드센스 심사·처음 온 방문자용) */
export function Landing({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div className="landing">
      <header className="lp-top">
        <span className="logo"><Logo /><b>장독대</b></span>
        <button className="ghost" type="button" onClick={onLogin}>로그인</button>
      </header>

      <section className="lp-hero">
        <p className="lp-eyebrow">책 · 웹툰 · 웹소설 · 영화 · 드라마 · 공연 도장깨기</p>
        <h1>매번 쌓아두는 책들,<br /><em>도장깨기</em> 하자!</h1>
        <p className="lp-lead">
          사둔 책과 보고 싶은 작품을 장독에 담아두세요.<br />
          모든 작품은 흑백으로 담기고, 다 읽으면 콕! 원래 색으로 돌아와요.
        </p>
        <div className="lp-cta">
          <button className="primary" type="button" onClick={onStart}>무료로 시작하기</button>
          <button className="ghost" type="button" onClick={onLogin}>이미 계정이 있어요</button>
        </div>
        <p className="lp-note">이메일 없이 아이디만으로 가입 · 휴대폰과 PC 동기화 · 앱 출시 전, 웹에서 바로 써요</p>
        <figure className="lp-shot lp-shot-wide">
          <img src="/landing/home.png" alt="장독대 홈 화면: 드라마, 만화카페, 도서관, 웹소설, 영화 장독이 놓여 있고 장독마다 남은 작품 수가 보여요" width="692" height="413" />
        </figure>
      </section>

      <section className="lp-story">
        <h2>왜 만들었냐면요</h2>
        <p>책을 사들이는 속도가 읽는 속도를 못 쫓아가는 사람, 저만은 아니죠? 📚</p>
        <p>
          독서 앱으로 문구 쓰고 줄거리 쓰고… 뭔가 작성하는 건 귀찮은데,
          <b> 내가 읽었다는 티는 내고 싶었어요.</b> 그래서 만들었어요.
          장독대에서 쓰는 건 <b>원할 때만 남기는 120자 메모</b>가 전부예요.
        </p>
        <p>다 만들고 나니 안 읽은 책을 등록하는 것조차 즐거워졌어요. 같이 깨봐요! 🔨</p>
      </section>

      <section className="lp-features">
        <h2>꼭 넣고 싶었던 기능</h2>

        <article className="lp-feature">
          <div className="lp-text">
            <span className="lp-num">1</span>
            <h3>사둔 책·영화·드라마를 담아두고 도장깨기</h3>
            <p>종류별로 장독을 놓고 작품을 담아요. 책은 제목만 검색하면 표지까지 쏙, 영화·드라마는 포스터를 붙여넣으면 끝.</p>
          </div>
        </article>

        <article className="lp-feature">
          <div className="lp-text">
            <span className="lp-num">2</span>
            <h3>도전해보고 싶은 시리즈도 한 장독에</h3>
            <p>전집, 시리즈, 작가 필모그래피까지. 다 읽은 책을 누르면 흑백이 <b>컬러</b>로 바뀌어요. 장독이 조금씩 색으로 채워지는 재미!</p>
          </div>
          <div className="lp-pair">
            <figure className="lp-shot">
              <img src="/landing/before.png" alt="한겨레 틴시리즈 장독: 12권 모두 흑백으로 담긴 모습" width="689" height="528" loading="lazy" />
              <figcaption>담았을 때: 모두 흑백</figcaption>
            </figure>
            <figure className="lp-shot">
              <img src="/landing/after.png" alt="다 읽은 2권이 컬러로 바뀌고 완료 표시가 붙은 모습" width="688" height="524" loading="lazy" />
              <figcaption>다 읽으면: 콕! 컬러로</figcaption>
            </figure>
          </div>
        </article>

        <article className="lp-feature">
          <div className="lp-text">
            <span className="lp-num">3</span>
            <h3>뭘 볼지 모를 땐, 한 국자 뜨기 <span className="lp-ladle"><LadleIcon /></span></h3>
            <p>쌓아둔 건 많은데 뭐부터 읽을지 모르겠다면? 모든 장독의 안 읽은 작품 중에서 오늘의 한 권을 골라줘요. [이걸로 할게]를 누르면 그 책이 있는 장독으로 바로 데려다줘요. 🎲</p>
          </div>
          <figure className="lp-shot lp-video">
            <video src="/landing/ladle.mp4" poster="/landing/ladle-poster.jpg" autoPlay muted loop playsInline preload="metadata"
              aria-label="한 국자 뜨기 시연: 표지들이 섞이다가 '식물, 상점'이 뽑히고, 이걸로 할게를 누르면 한겨레 틴시리즈 장독에서 그 책이 강조돼요" />
            <figcaption>실제로 써본 화면 · 한 국자 떠서 오늘의 책 고르기</figcaption>
          </figure>
        </article>
      </section>

      <section className="lp-more">
        <h2>그리고 이런 것도 돼요</h2>
        <ul>
          <li><b>🫙 장독 깨기</b><span>장독을 끝까지 비우면 쨍그랑! 깬 장독은 따로 모아 봐요.</span></li>
          <li><b>📅 이달의 리포트</b><span>이번 달에 해치운 작품을 장독별로 한눈에.</span></li>
          <li><b>⭐ 별점·메모</b><span>원할 때만. 체크만 하고 싶으면 체크만!</span></li>
          <li><b>📱 휴대폰 ↔ PC</b><span>같은 아이디로 어디서든 같은 장독대.</span></li>
        </ul>
      </section>

      <section className="lp-how">
        <h2>시작은 이렇게</h2>
        <ol>
          <li><b>아이디·비밀번호로 가입</b> 이메일, 전화번호는 받지 않아요.</li>
          <li><b>새 장독 놓기</b> 책, 웹툰, 영화… 종류를 고르고 이름을 붙여요.</li>
          <li><b>담기</b> 검색하거나 표지를 붙여넣어 작품을 담아요.</li>
          <li><b>다 보면 콕!</b> 흑백이 컬러로. 장독을 다 비우면 깨기!</li>
        </ol>
        <p className="lp-tip">📱 휴대폰에서는 접속 후 <b>홈 화면에 추가</b>하면 앱처럼 쓸 수 있어요. (아이폰: 사파리 공유 버튼 / 안드로이드: 크롬 ⋮ 메뉴)</p>
      </section>

      <section className="lp-faq">
        <h2>자주 묻는 질문</h2>
        <details><summary>무료인가요?</summary><p>네, 무료예요. 운영을 위해 나중에 광고가 붙을 수 있어요.</p></details>
        <details><summary>이메일 없이 가입하면 비밀번호는 어떻게 찾나요?</summary><p>가입할 때 한 번 보여드리는 <b>복구 코드</b>로 비밀번호를 다시 정할 수 있어요. 꼭 캡처해 두세요.</p></details>
        <details><summary>앱은 언제 나와요?</summary><p>안드로이드 앱을 플레이스토어에 준비하고 있어요. 그전까지는 웹에서 똑같이 쓸 수 있고, 홈 화면에 추가하면 앱처럼 열려요.</p></details>
        <details><summary>웹툰·웹소설 표지는 어떻게 넣어요?</summary><p>작품 페이지의 표지 이미지를 복사해 붙여넣거나, 앱 화면을 캡처해서 ‘사진 고르기’로 넣으면 돼요. 표지가 없으면 제목으로 기본 표지를 만들어 줘요.</p></details>
        <details><summary>내 기록은 다른 사람도 볼 수 있나요?</summary><p>아니요. 장독과 메모는 나만 볼 수 있어요. 자랑하고 싶을 땐 이달의 리포트를 캡처해서 공유해 주세요.</p></details>
      </section>

      <section className="lp-final">
        <h2>묵혀둔 책, 같이 깨실 분? 🙋</h2>
        <button className="primary" type="button" onClick={onStart}>무료로 시작하기</button>
      </section>

      <footer className="lp-foot">
        <div><a href="/privacy.html">개인정보처리방침</a> · <a href="/terms.html">이용약관</a> · 문의 leah.contact.948@gmail.com</div>
        <div>© 2026 장독대</div>
      </footer>
    </div>
  );
}
