import type { ReactNode } from 'react';
import { Sheet } from './ui';
import { JAR_BODY, LadleIcon, StarIco } from './visuals';

/** 작은 옹기 아이콘 (이용방법 머리말용) */
function MiniJar({ cracked = false }: { cracked?: boolean }) {
  return (
    <svg viewBox="0 0 100 104" aria-hidden="true">
      <path d={JAR_BODY} fill="var(--brand)" />
      <rect x="31" y="11" width="38" height="10" rx="3" fill="var(--brand)" />
      {cracked && <path d="M53 21 L45 39 L57 51 L46 66 L55 80" fill="none" stroke="var(--surface)" strokeWidth="5" strokeLinejoin="round" />}
    </svg>
  );
}

function Step({ icon, title, open = false, children }: { icon: ReactNode; title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="help-step" open={open}>
      <summary>
        <span className="help-ico">{icon}</span>
        <span>{title}</span>
      </summary>
      <div className="help-body">{children}</div>
    </details>
  );
}

export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose} label="장독대 이용방법">
      <div className="help-head">
        <MiniJar />
        <div>
          <h2>장독대 이용방법</h2>
          <p className="lead">보고 싶은 걸 담아 묵혀두고, 하나씩 꺼내 맛보는 곳이에요.</p>
        </div>
      </div>

      <div className="help-list">
        <Step icon={<MiniJar />} title="1. 장독 놓기">
          <p>홈에서 <b>+ 새 장독 놓기</b>를 눌러 종류(책, 영화, 웹툰…)를 고르고 이름을 붙여요.</p>
          <p className="help-tip">한 장독에는 한 종류만 담겨요. 취미별로 여러 개 놓아보세요.</p>
        </Step>

        <Step icon={<span className="help-emoji">🖼️</span>} title="2. 담기 · 표지 넣는 법" open>
          <p>장독 안에서 <b>+ 담기</b>를 눌러요. 종류에 따라 편한 방법이 달라요.</p>

          <div className="help-card">
            <h4>📚 책 · 웹소설 · 만화책</h4>
            <p><b>검색</b> 탭에서 제목을 찾아 <b>담기</b>만 누르면 표지까지 쏙!</p>
            <p className="help-tip">카카오 책 검색이라 <b>종이책·전자책으로 나온 작품</b>만 찾을 수 있어요. 연재 중인 웹툰·웹소설은 아래 ‘표지 넣기’로 담아주세요.</p>
          </div>

          <div className="help-card">
            <h4>🎬 영화 · 드라마 · 예능</h4>
            <p><b>검색</b> 탭에서 제목을 찾으면 <b>공식 포스터</b>까지 쏙! (TMDB 영화 데이터베이스)</p>
            <p className="help-tip">원하는 포스터가 없으면 옆의 ‘표지 넣기’로 직접 넣어도 돼요.</p>
          </div>

          <div className="help-card">
            <h4>🎭 공연 · 연재 웹툰 (또는 검색에 없을 때)</h4>
            <p><b>표지 넣기</b> 탭에서 세 가지 중 하나를 골라요.</p>
            <ol className="help-ways">
              <li><b>이미지 복사 → 붙여넣기</b> <span className="pill">제일 쉬워요</span><br />
                포스터를 <b>길게 눌러</b>(PC는 오른쪽 클릭) ‘이미지 복사’ → ‘표지 넣기’ 칸을 눌러 <b>붙여넣기</b></li>
              <li><b>캡처해서 사진 고르기</b><br />표지를 화면 캡처한 뒤 <b>사진 고르기</b></li>
              <li><b>작품 페이지 주소 붙여넣기</b><br />리디 · 레진 · 네이버 웹툰 · 교보 · YES24, 공연 예매 페이지(NOL·티켓링크 등)는 주소만 넣어도 표지·포스터를 찾아와요</li>
            </ol>
            <p className="help-tip">카카오웹툰 · 카카오페이지 · 봄툰은 표지를 그대로 가져오기 어려워요. 화면을 캡처해서 ‘사진 고르기’로 넣어주세요.</p>
          </div>

          <div className="help-card">
            <h4>📱 휴대폰에서 앱으로 보고 있다면</h4>
            <p>카카오페이지·네이버 웹툰 같은 <b>앱 안에서는</b> 이미지 복사나 링크 복사가 잘 안 돼요. 이렇게 해보세요.</p>
            <ol className="help-ways">
              <li><b>사파리·크롬 같은 인터넷 브라우저</b>를 열고 작품 이름을 검색해 작품 페이지로 들어가요</li>
              <li>표지를 <b>길게 눌러 ‘이미지 복사’</b>, 또는 주소창의 <b>링크를 복사</b>해요</li>
              <li>장독대 ‘표지 넣기’ 칸에 <b>붙여넣기</b></li>
            </ol>
            <p className="help-tip">제일 간단한 방법은 앱 화면을 <b>캡처</b>해서 ‘사진 고르기’로 넣는 거예요.</p>
          </div>

          <div className="help-card">
            <h4>✏️ 표지가 없어도 괜찮아요</h4>
            <p><b>직접 입력</b>으로 제목만 적으면 예쁜 기본 표지를 만들어 줘요. 나중에 작품 <b>⋯ → 표지 바꾸기</b>로 바꿀 수 있어요.</p>
          </div>
        </Step>

        <Step icon={<span className="help-emoji">🎨</span>} title="3. 다 봤으면 콕!">
          <p>표지나 <b>미완료</b> 버튼을 누르면 흑백이 <b>컬러</b>로 바뀌어요. 다시 누르면 흑백으로 돌아가요.</p>
          <p><StarIco /> 별점과 메모는 <b>⋯</b>에서 <b>원할 때만</b> 남겨요.</p>
          <p className="help-tip">⋯에서 표지 바꾸기와 장독에서 빼기도 할 수 있고, 장독 화면의 <b>순서 바꾸기</b>로 카드 순서를 옮길 수 있어요.</p>
        </Step>

        <Step icon={<span className="help-ladle"><LadleIcon /></span>} title="4. 뭘 볼지 모를 땐, 한 국자 뜨기">
          <p>오른쪽 아래 <b>한 국자 뜨기</b>를 누르면 모든 장독의 미완료 중 하나를 골라줘요.</p>
        </Step>

        <Step icon={<MiniJar cracked />} title="5. 장독 깨기 · 치우기">
          <p>장독을 <b>다 비우면</b> <b>장독 깨기</b> 버튼이 나와요. 쨍그랑! 깬 장독은 ‘깬 장독’ 탭에 모여요.</p>
          <p className="help-tip">장독을 지우고 싶을 땐 장독 안 <b>⋯ → 장독 치우기</b>.</p>
        </Step>

        <Step icon={<span className="help-emoji">📅</span>} title="6. 이달의 리포트">
          <p>홈 위쪽 <b>이달의 리포트</b>에서 이번 달 해치운 작품을 모아 봐요. 캡처해서 자랑해도 좋아요.</p>
        </Step>

        <Step icon={<span className="help-emoji">📱</span>} title="7. 휴대폰에서 앱처럼 쓰기">
          <p>장독대 주소로 접속한 뒤 홈 화면에 추가하면 앱처럼 바로 열려요.</p>
          <ul className="help-ways">
            <li><b>아이폰(사파리)</b>: 아래 <b>공유</b> 버튼 → <b>홈 화면에 추가</b></li>
            <li><b>안드로이드(크롬)</b>: 오른쪽 위 <b>⋮</b> → <b>홈 화면에 추가</b></li>
          </ul>
          <p className="help-tip">같은 아이디로 로그인하면 휴대폰과 PC가 함께 맞춰져요.</p>
        </Step>
      </div>

      <p className="legal-links"><a href="/privacy.html">개인정보처리방침</a> · <a href="/terms.html">이용약관</a> · 문의 leah.contact.948@gmail.com</p>
      <div className="sheet-actions"><button className="primary" type="button" onClick={onClose}>알겠어요</button></div>
    </Sheet>
  );
}
