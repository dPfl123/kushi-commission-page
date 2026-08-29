const form = document.getElementById("commissionForm");
      const lensDetails = document.getElementById("lensDetails");
      const copyOutput = document.getElementById("copyOutput");
      const copyStatus = document.getElementById("copyStatus");
      const confirmCount = document.getElementById("confirmCount");
      const nicknameInput = document.getElementById("appName");
      if (nicknameInput) {
        const nicknameLabel = nicknameInput.closest("label");
        const nicknameTitle = nicknameLabel?.querySelector("span");
        if (nicknameTitle) nicknameTitle.textContent = "닉네임";
        nicknameInput.placeholder = "닉네임을 적어주세요";
      }
      document.getElementById("appUse")?.closest("label")?.remove();

      const usageOptions = document.createElement("fieldset");
      usageOptions.className = "option-box usage-option-box";
      usageOptions.innerHTML = `
        <legend>용도 · 한 개 선택</legend>
        <div class="usage-choice-grid">
          <label class="option-pill"><input type="checkbox" name="usageMultiplier" value="상업용|0" data-multiplier="2"><span><b>상업용</b><small>×2</small></span></label>
          <label class="option-pill"><input type="checkbox" name="usageMultiplier" value="비상업용|0" data-multiplier="1"><span><b>비상업용</b><small>×0 · 추가 배수 없음</small></span></label>
          <label class="option-pill"><input type="checkbox" name="usageMultiplier" value="저작권 양도|0" data-multiplier="2"><span><b>저작권 양도</b><small>×2</small></span></label>
          <label class="option-pill"><input type="checkbox" name="usageMultiplier" value="상업용 + 저작권 양도|0" data-multiplier="3"><span><b>상업용 + 저작권 양도</b><small>×3</small></span></label>
        </div>`;
      form.insertBefore(usageOptions, lensDetails);
      const won = (n) => Math.max(0, n).toLocaleString("ko-KR") + "원";
      const productGroups = [
        "setProduct",
        "singleProduct",
        "extra",
        "confirmCount",
        "discount",
      ];
      function selected(selector) {
        return [...document.querySelectorAll(selector + ":checked")].map(
          (input) => {
            const [name, price] = input.value.split("|");
            return { name, price: Number(price), input };
          },
        );
      }
      function allSelected() {
        const discountSelect = document.getElementById("discountSelect");
        const discount = discountSelect.value
          ? (() => {
              const [name, price] = discountSelect.value.split("|");
              return [{ name, price: Number(price), input: discountSelect }];
            })()
          : [];
        const count = Number(
          confirmCount.value || confirmCount.textContent || 0,
        );
        const confirmations = count
          ? [
              {
                name: `컨펌 추가 ${count}회`,
                price: count * 3000,
                input: confirmCount,
              },
            ]
          : [];
        return [
          ...selected('input[name="consult"]'),
          ...selected('input[name="setProduct"]'),
          ...selected('input[name="singleProduct"]'),
          ...selected('input[name="extra"]'),
          ...selected('input[name="usageMultiplier"]'),
          ...confirmations,
          ...discount,
        ];
      }
      function refreshSelected(items) {
        const box = document.getElementById("selectedProducts");
        box.innerHTML = "";
        if (!items.length) {
          box.innerHTML = "<p>아직 선택한 상품이 없어요.</p>";
          return;
        }
        items.forEach((item) => {
          const chip = document.createElement("span");
          chip.className = "selected-chip";
          chip.style.cssText = "display:inline-flex;align-items:center;gap:7px;padding:7px 9px 7px 11px;border:1px solid #efcddd;border-radius:99px;color:#9c6881;background:#fff;font-size:11px";
          chip.append(document.createTextNode(item.name));
          const remove = document.createElement("button");
          remove.type = "button";
          remove.textContent = "×";
          remove.style.cssText = "width:20px;height:20px;padding:0;border:0;border-radius:50%;color:#fff;background:#e18db5";
          remove.setAttribute("aria-label", item.name + " 선택 해제");
          remove.onclick = () => {
            if (item.input.tagName === "SELECT") item.input.value = "";
            else if (item.input === confirmCount) {
              confirmCount.value = 0;
              confirmCount.textContent = "0";
            } else item.input.checked = false;
            calculate();
          };
          chip.append(remove);
          box.append(chip);
        });
      }
      function calculate() {
        const items = allSelected();
        const baseTotal = items.reduce((sum, item) => sum + item.price, 0);
        const usageInput = document.querySelector(
          'input[name="usageMultiplier"]:checked',
        );
        const multiplier = Number(usageInput?.dataset.multiplier || 1);
        const total = Math.max(0, baseTotal) * multiplier;
        document.getElementById("estimatePrice").textContent = won(total);
        const estimate = document.querySelector("#application .estimate");
        let formula = document.getElementById("estimateFormula");
        if (!formula && estimate) {
          formula = document.createElement("small");
          formula.id = "estimateFormula";
          estimate.querySelector("strong")?.before(formula);
        }
        if (formula) {
          const usageName = usageInput?.value.split("|")[0];
          formula.textContent = usageInput
            ? usageName === "비상업용"
              ? `${won(baseTotal)} · 추가 ×0`
              : `${won(baseTotal)} × ${multiplier}`
            : `${won(baseTotal)} · 용도 미선택`;
        }
        const hasLensProduct =
          selected('input[name="setProduct"]').length > 0 ||
          selected('input[name="singleProduct"]').some((item) =>
            item.name.includes("렌즈"),
          );
        lensDetails.hidden = !hasLensProduct;
        document.querySelectorAll(".option-pill input").forEach((input) => {
          const pill = input.nextElementSibling;
          if (!pill) return;
          pill.style.color = input.checked ? "#fff" : "#9b7185";
          pill.style.borderColor = input.checked ? "#eb9bc0" : "#efcede";
          pill.style.background = input.checked ? "#dc83ad" : "#fff";
          pill.querySelectorAll("small").forEach((small) => {
            small.style.color = input.checked ? "#fff" : "#ad8b9b";
          });
        });
        refreshSelected(items);
        copyOutput.value = applicationText(false);
        return { items, total: Math.max(0, total) };
      }
      form.addEventListener("change", (event) => {
        const input = event.target;
        if (!input || input.tagName !== "INPUT" || !input.checked)
          return calculate();
        if (input.name === "setProduct") {
          selected('input[name="setProduct"]').forEach((item) => {
            if (item.input !== input) item.input.checked = false;
          });
          const singles = selected('input[name="singleProduct"]');
          if (
            singles.length &&
            confirm("단일 구성 선택을 취소하고 세트를 선택할까요?")
          )
            singles.forEach((item) => (item.input.checked = false));
          else if (singles.length) input.checked = false;
        }
        if (input.name === "singleProduct") {
          const sets = selected('input[name="setProduct"]');
          if (
            sets.length &&
            confirm("세트 선택을 취소하고 단일 구성을 선택할까요?")
          )
            sets.forEach((item) => (item.input.checked = false));
          else if (sets.length) input.checked = false;
        }
        if (input.name === "usageMultiplier") {
          selected('input[name="usageMultiplier"]').forEach((item) => {
            if (item.input !== input) item.input.checked = false;
          });
        }
        calculate();
      });
      // Artmug may break the native label-to-checkbox click connection after
      // sanitizing the pasted HTML. Toggle choices explicitly so the visible
      // cards remain usable on desktop and iPad.
      form.querySelectorAll("label.option-pill").forEach((label) => {
        const input = label.querySelector('input[type="checkbox"]');
        if (!input) return;
        label.style.cursor = "pointer";
        const visibleCard = input.nextElementSibling;
        if (visibleCard) visibleCard.style.cursor = "pointer";
        label.addEventListener("click", (event) => {
          event.preventDefault();
          input.checked = !input.checked;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      });
      form.addEventListener("input", (event) => {
        if (event.target && event.target.matches("input, textarea")) {
          copyOutput.value = applicationText(false);
        }
      });
      form.addEventListener("focusin", () => {
        form.dataset.scrollY = String(window.scrollY);
      });
      form.addEventListener("focusout", () => {
        const previousY = Number(form.dataset.scrollY || window.scrollY);
        requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - previousY) > 120) {
            window.scrollTo(0, previousY);
          }
        });
      });
      function value(id) {
        const element = document.getElementById(id);
        return element && element.value.trim()
          ? element.value.trim()
          : "미작성";
      }
      function applicationText(refresh = true) {
        const result = refresh
          ? calculate()
          : {
              items: allSelected(),
              total:
                Math.max(
                  0,
                  allSelected().reduce((sum, item) => sum + item.price, 0),
                ) *
                Number(
                  document.querySelector(
                    'input[name="usageMultiplier"]:checked',
                  )?.dataset.multiplier || 1,
                ),
            };
        const consults = result.items.filter(
          (item) => item.input.name === "consult",
        );
        const products = result.items.filter((item) =>
          productGroups.includes(item.input.name),
        );
        const line = (item) =>
          item.price === 0
            ? `· ${item.name}`
            : `· ${item.name} (${item.price < 0 ? "−" : "+"}${Math.abs(item.price).toLocaleString("ko-KR")}원)`;
        const lensLine = lensDetails.hidden
          ? ""
          : `\n렌즈 필수 요소 : ${value("appLens")}`;
        const usage = result.items.find(
          (item) => item.input.name === "usageMultiplier",
        );
        return `[3D 버츄얼 얼굴 · 렌즈 원화 신청서]\n\n닉네임 : ${value("appName")}\n캐릭터 자료 링크 : ${value("appLink")}\n\n상담 선택\n${consults.length ? consults.map(line).join("\n") : "· 선택 없음"}\n\n신청 상품 및 옵션\n${products.length ? products.map(line).join("\n") : "· 선택 없음"}\n\n용도 : ${usage ? usage.name : "선택 없음"}\n예상 견적 : ${won(result.total)}\n희망 마감일 : ${value("appDeadline")}\n원하는 분위기·참고 자료 : ${value("appStyle")}${lensLine}\n기타 요청사항 : ${value("appEtc")}`;
      }
      async function copyApplication() {
        const text = applicationText();
        copyOutput.value = text;
        try {
          if (!navigator.clipboard || !navigator.clipboard.writeText) {
            throw new Error("clipboard unavailable");
          }
          await navigator.clipboard.writeText(text);
          copyStatus.textContent = "작성한 신청서가 복사되었습니다!";
        } catch (e) {
          const savedY = window.scrollY;
          copyOutput.focus({ preventScroll: true });
          copyOutput.select();
          copyOutput.setSelectionRange(0, copyOutput.value.length);
          let copied = false;
          try {
            copied = document.execCommand("copy");
          } catch (_) {}
          window.scrollTo(0, savedY);
          copyStatus.textContent = copied
            ? "작성한 신청서가 복사되었습니다!"
            : "복사 권한이 막혔어요. 아래 미리보기 칸을 길게 눌러 복사해주세요.";
        }
        setTimeout(() => (copyStatus.textContent = ""), 2500);
      }
      function resetApplication() {
        const savedY = window.scrollY;
        form.reset();
        document.getElementById("appLens").value = "";
        confirmCount.value = 0;
        confirmCount.textContent = "0";
        calculate();
        window.scrollTo(0, savedY);
        copyStatus.textContent = "신청서를 초기화했어요";
        setTimeout(() => (copyStatus.textContent = ""), 1800);
      }
      document
        .getElementById("copyApplication")
        .addEventListener("click", copyApplication);
      document
        .getElementById("resetApplication")
        .addEventListener("click", resetApplication);
      function changeConfirmCount(delta) {
        const next = Math.max(
          0,
          Number(confirmCount.value || confirmCount.textContent || 0) + delta,
        );
        confirmCount.value = next;
        confirmCount.textContent = String(next);
        calculate();
      }
      const confirmMinus = document.getElementById("confirmMinus");
      const confirmPlus = document.getElementById("confirmPlus");
      confirmMinus.textContent = "−";
      confirmPlus.textContent = "+";
      [confirmMinus, confirmPlus].forEach((button) => {
        button.style.color = "#713a55";
        button.style.fontWeight = "900";
        button.style.lineHeight = "1";
      });
      confirmMinus.addEventListener("click", () => changeConfirmCount(-1));
      confirmPlus.addEventListener("click", () => changeConfirmCount(1));
      // FAQ: open the clicked answer and close the previously opened one.
      // This also works when Artmug changes the native <details> behavior.
      document.querySelectorAll("#faq details.faq-item").forEach((item) => {
        const summary = item.querySelector("summary");
        const answer = item.querySelector(".faq-answer");
        if (!summary || !answer) return;
        summary.removeAttribute("contenteditable");
        answer.removeAttribute("contenteditable");
        answer.style.display = "block";
        answer.style.maxHeight = "0px";
        answer.style.opacity = "0";
        item.removeAttribute("open");
        item.classList.remove("is-open");
        summary.setAttribute("role", "button");
        summary.setAttribute("aria-expanded", "false");
        summary.addEventListener("click", (event) => {
          event.preventDefault();
          const shouldOpen = !item.classList.contains("is-open");
          document.querySelectorAll("#faq details.faq-item").forEach((other) => {
            const otherAnswer = other.querySelector(".faq-answer");
            const otherSummary = other.querySelector("summary");
            other.removeAttribute("open");
            other.classList.remove("is-open");
            if (otherAnswer) {
              otherAnswer.style.maxHeight = "0px";
              otherAnswer.style.opacity = "0";
            }
            if (otherSummary) otherSummary.setAttribute("aria-expanded", "false");
          });
          if (shouldOpen) {
            item.setAttribute("open", "");
            item.classList.add("is-open");
            requestAnimationFrame(() => {
              answer.style.maxHeight = answer.scrollHeight + "px";
              answer.style.opacity = "1";
            });
            summary.setAttribute("aria-expanded", "true");
          }
        });
      });

      // Soft cursor aura and click sparkles for the public presentation.
      (() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) return;
        const aura = document.createElement("div");
        aura.className = "kusi-cursor-aura";
        (document.getElementById("top") || document.body).append(aura);
        let auraFrame = 0;
        let pointerX = 0;
        let pointerY = 0;
        document.addEventListener("pointermove", (event) => {
          if (event.pointerType && event.pointerType !== "mouse") return;
          pointerX = event.clientX;
          pointerY = event.clientY;
          aura.style.opacity = ".52";
          if (auraFrame) return;
          auraFrame = requestAnimationFrame(() => {
            aura.style.transform = `translate3d(${pointerX - 95}px,${pointerY - 95}px,0)`;
            auraFrame = 0;
          });
        }, { passive: true });
        document.documentElement.addEventListener("mouseleave", () => (aura.style.opacity = "0"));
        document.addEventListener("click", (event) => {
          for (let index = 0; index < 30; index += 1) {
            const spark = document.createElement("i");
            const angle = (Math.PI * 2 * index) / 30 + Math.random() * .28;
            const distance = 42 + Math.random() * 82;
            spark.className = "kusi-spark";
            spark.style.left = event.clientX + "px";
            spark.style.top = event.clientY + "px";
            spark.style.setProperty("--spark-x", Math.cos(angle) * distance + "px");
            spark.style.setProperty("--spark-y", Math.sin(angle) * distance + "px");
            spark.style.setProperty("--spark-size", 7 + Math.random() * 9 + "px");
            spark.style.animationDelay = index * 4 + "ms";
            document.body.append(spark);
            spark.addEventListener("animationend", () => spark.remove(), { once: true });
          }
        });
        document.querySelectorAll('.partner-link[aria-disabled="true"]').forEach((link) => {
          link.addEventListener("click", (event) => event.preventDefault());
        });
      })();
      const pageRoot =
        document.getElementById("kusiPage") ||
        document.querySelector("#top > main");
      const footer = pageRoot && pageRoot.querySelector("footer");
      if (pageRoot && footer) {
        [
          "creator",
          "collab",
          "guide",
          "price",
          "samples",
          "adopt",
          "application",
          "faq",
        ].forEach((id) => {
          const section = document.getElementById(id);
          if (section) pageRoot.insertBefore(section, footer);
        });
      }

      function applyKusiResponsiveLayout() {
        const width = window.innerWidth;
        const page =
          document.getElementById("kusiPage") ||
          document.querySelector("#top > main");
        const menu =
          document.getElementById("kusiMenu") ||
          document.querySelector('#top nav[aria-label="커미션 상세페이지 메뉴"]');
        const hero = document.getElementById("kusiHero");
        const heroTitle = hero && hero.querySelector("h1");
        const partnerGrid = document.getElementById("partnerGrid");
        const sampleGrid = document.getElementById("sampleGrid");
        const adoptGrid = document.getElementById("adoptGrid");
        const formGrid = document.getElementById("commissionForm");
        const consultGrid = document.getElementById("consultGrid");
        const sections = document.querySelectorAll("#top section");

        if (!page || !menu) return;

        if (width <= 820) {
          page.style.width = "calc(100% - 20px)";
          page.style.marginLeft = "auto";
          page.style.marginRight = "auto";
          page.style.paddingTop = "18px";
          page.style.paddingBottom = "115px";

          menu.style.top = "auto";
          menu.style.bottom = "10px";
          menu.style.left = "10px";
          menu.style.right = "10px";
          menu.style.width = "auto";
          menu.style.padding = "8px";
          menu.style.borderRadius = "18px";
          menu.style.display = "flex";
          menu.style.gap = "5px";
          menu.style.overflowX = "auto";
          menu.style.alignItems = "center";

          const title = menu.querySelector("p");
          if (title) title.style.display = "none";
          menu.querySelectorAll("a").forEach((link) => {
            link.style.minWidth = "82px";
            link.style.minHeight = "38px";
            link.style.margin = "0";
            link.style.padding = "7px";
            link.style.fontSize = "12px";
            link.style.whiteSpace = "nowrap";
            link.style.flex = "0 0 auto";
          });

          [partnerGrid, sampleGrid, adoptGrid, formGrid].forEach((grid) => {
            if (grid) grid.style.gridTemplateColumns = "1fr";
          });
          if (consultGrid) {
            consultGrid.style.gridTemplateColumns =
              width <= 560 ? "1fr" : "repeat(3, minmax(0, 1fr))";
          }
          sections.forEach((section) => (section.style.padding = "20px"));
          if (hero) hero.style.padding = "42px 20px";
          if (heroTitle) {
            heroTitle.style.fontSize = "clamp(30px, 7vw, 44px)";
            heroTitle.style.wordBreak = "keep-all";
            heroTitle.style.overflowWrap = "normal";
          }
        } else if (width <= 1200) {
          page.style.width = "min(840px, calc(100% - 260px))";
          page.style.marginLeft = "auto";
          page.style.marginRight = "auto";
          page.style.paddingTop = "35px";
          page.style.paddingBottom = "70px";

          menu.style.top = "150px";
          menu.style.bottom = "auto";
          menu.style.left = "auto";
          menu.style.right = "8px";
          menu.style.width = "130px";
          menu.style.padding = "10px 8px";
          menu.style.borderRadius = "20px";
          menu.style.display = "block";
          menu.style.overflowX = "visible";

          const title = menu.querySelector("p");
          if (title) title.style.display = "block";
          menu.querySelectorAll("a").forEach((link) => {
            link.style.minWidth = "0";
            link.style.minHeight = "34px";
            link.style.margin = "4px 0";
            link.style.padding = "6px 8px";
            link.style.fontSize = "11px";
            link.style.whiteSpace = "normal";
            link.style.flex = "none";
          });

          [partnerGrid, sampleGrid, adoptGrid, formGrid].forEach((grid) => {
            if (grid) grid.style.gridTemplateColumns = "1fr";
          });
          if (consultGrid)
            consultGrid.style.gridTemplateColumns =
              "repeat(3, minmax(0, 1fr))";
          sections.forEach((section) => (section.style.padding = "24px"));
          if (hero) hero.style.padding = "58px 28px";
          if (heroTitle) {
            heroTitle.style.fontSize = "clamp(32px, 5vw, 52px)";
            heroTitle.style.wordBreak = "keep-all";
            heroTitle.style.overflowWrap = "normal";
          }
        } else {
          page.style.width = "min(1080px, calc(100% - 30px))";
          page.style.marginLeft = "auto";
          page.style.marginRight = "auto";
          page.style.paddingTop = "52px";
          page.style.paddingBottom = "70px";

          menu.style.top = "150px";
          menu.style.bottom = "auto";
          menu.style.left = "auto";
          menu.style.right = "18px";
          menu.style.width = "164px";
          menu.style.padding = "13px 10px";
          menu.style.borderRadius = "20px";
          menu.style.display = "block";
          menu.style.overflowX = "visible";

          const title = menu.querySelector("p");
          if (title) title.style.display = "block";
          menu.querySelectorAll("a").forEach((link) => {
            link.style.minWidth = "0";
            link.style.minHeight = "34px";
            link.style.margin = "4px 0";
            link.style.padding = "6px 8px";
            link.style.fontSize = "12px";
            link.style.whiteSpace = "normal";
            link.style.flex = "none";
          });

          [partnerGrid, sampleGrid, adoptGrid].forEach((grid) => {
            if (grid)
              grid.style.gridTemplateColumns =
                "repeat(2, minmax(0, 1fr))";
          });
          if (formGrid) formGrid.style.gridTemplateColumns = "1fr 1fr";
          if (consultGrid)
            consultGrid.style.gridTemplateColumns =
              "repeat(3, minmax(0, 1fr))";
          sections.forEach((section) => (section.style.padding = "32px"));
          if (hero) hero.style.padding = "72px 38px";
          if (heroTitle) {
            heroTitle.style.fontSize = "clamp(32px, 5vw, 58px)";
            heroTitle.style.wordBreak = "keep-all";
            heroTitle.style.overflowWrap = "normal";
          }
        }
      }

      applyKusiResponsiveLayout();
      window.addEventListener("resize", applyKusiResponsiveLayout);
      if (discountSelect?.options?.length >= 3) {
        discountSelect.options[1].value = "푸돌이님 원화 추가 할인|-10000";
        discountSelect.options[1].textContent =
          "푸돌이님 · 원화 추가 10,000원 할인";
        discountSelect.options[2].value = "노랭꼬님 원화 할인|-20000";
        discountSelect.options[2].textContent =
          "노랭꼬님 · Kusi 원화 20,000원 할인";
      }
      calculate();

      const creatorCard = document.querySelector("#creator .creator-card");
      if (creatorCard) {
        creatorCard.classList.add("kusi-artist-intro");
        creatorCard.innerHTML = `
          <div class="creator-visual" aria-label="Kusi 대표 이미지 영역">
            <img src="assets/partners/kusi-profile.png" alt="Kusi 작가 프로필">
          </div>
          <div class="creator-intro-copy">
            <p class="creator-greeting">HELLO, I'M</p>
            <h3>Kusi</h3>
            <p>안녕하세요, 3D 버츄얼 얼굴과 렌즈 원화를 작업하는 Kusi입니다. 캐릭터 고유의 분위기와 매력이 또렷하게 보이도록 한 장 한 장 정성껏 작업하겠습니다.</p>
          </div>`;
      }

      const partnerTags = [
        ["#쿠시돌이Pick", "#3D버츄얼", "#퀄리티"],
        ["#친절상담", "#3D버츄얼", "#퀄리티"],
      ];
      document.querySelectorAll(".partner-card").forEach((card, index) => {
        const portrait = card.querySelector(".partner-portrait");
        if (!portrait) return;
        portrait.classList.add("profile-photo-slot");
        portrait.title = "1:1 비율의 프로필 사진을 넣는 영역입니다.";
        const copy = card.querySelector(".editable-copy");
        const detail = copy?.querySelectorAll(".static-copy")[2];
        if (detail && index === 0) {
          detail.innerHTML =
            "푸돌이님 추가금에 원화 추가 시 <strong>10,000원 할인</strong>";
        }
        if (detail && index === 1) {
          detail.innerHTML =
            "노랭꼬 작가 <strong>데뷔세트 20,000원 할인</strong> · 쿠시돌이 작가 <strong>원화 20,000원 할인</strong>";
        }
        if (index === 0) {
          const image = document.createElement("img");
          image.src = "assets/partners/poodol.png";
          image.alt = "푸돌이님 프로필";
          portrait.replaceChildren(image);
          portrait.classList.add("has-photo");
          portrait.title = "푸돌이님 프로필";
        }
        if (index === 1) {
          const image = document.createElement("img");
          image.src = "assets/partners/noraengggo.png";
          image.alt = "노랭꼬님 프로필";
          portrait.replaceChildren(image);
          portrait.classList.add("has-photo");
          portrait.title = "노랭꼬님 프로필";

          const oldLink = copy?.querySelector(".partner-link");
          if (oldLink) {
            const activeLink = oldLink.cloneNode(true);
            activeLink.href = "https://artmug.kr/index.php?channel=view&uid=49397";
            activeLink.target = "_blank";
            activeLink.rel = "noopener noreferrer";
            activeLink.removeAttribute("aria-disabled");
            activeLink.title = "노랭꼬님 아트머그 페이지 열기";
            oldLink.replaceWith(activeLink);
          }
        }
        if (copy && partnerTags[index]) {
          const tags = document.createElement("div");
          tags.className = "partner-tags";
          tags.innerHTML = partnerTags[index]
            .map((tag) => `<span>${tag}</span>`)
            .join("");
          copy.insertBefore(tags, copy.querySelector(".partner-link"));
        }
      });

      const applicationForm = document.getElementById("commissionForm");
      document.getElementById("applicationPriceGuide")?.remove();

      if (applicationForm && !applicationForm.classList.contains("quote-layout")) {
        const applicationSection = applicationForm.closest("#application");
        const originalFields = [...applicationForm.children];
        const leftColumn = document.createElement("div");
        const rightColumn = document.createElement("div");
        leftColumn.className = "quote-column quote-column-options";
        rightColumn.className = "quote-column quote-column-details";
        leftColumn.innerHTML = `
          <header class="quote-column-head"><span>01 PACKAGE & OPTION</span><h3>필요한 작업을 골라주세요</h3><p>기존 상품과 추가 옵션을 원하는 만큼 선택할 수 있어요.</p></header>`;
        rightColumn.innerHTML = `
          <header class="quote-column-head"><span>02 REQUEST DETAILS</span><h3>상담에 필요한 내용을 적어주세요</h3><p>작성 내용은 신청서 복사 버튼으로 한 번에 정리됩니다.</p></header>`;

        originalFields.forEach((field) => {
          const belongsLeft =
            field.matches("fieldset") &&
            !field.matches(".usage-option-box");
          (belongsLeft ? leftColumn : rightColumn).append(field);
        });

        [".estimate", ".form-actions", ".copy-preview", ".copy-status"].forEach(
          (selector) => {
            const element = applicationSection?.querySelector(selector);
            if (element) rightColumn.append(element);
          },
        );
        applicationForm.classList.add("quote-layout");
        applicationForm.append(leftColumn, rightColumn);
      }

      const reveals = document.querySelectorAll(".reveal");
      const motionItems = document.querySelectorAll(
        ".mini, .step, .price-item, .partner-card, .sample-category, .public-adopt-card, .option-box, .faq-item, .application-price-row",
      );
      motionItems.forEach((element, index) => {
        element.classList.add("kusi-motion-item");
        element.style.setProperty("--item-delay", `${(index % 4) * 55}ms`);
      });
      const revealTargets = [...reveals, ...motionItems];
      if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
        );
        revealTargets.forEach((element, index) => {
          if (element.classList.contains("reveal")) {
            element.style.setProperty("--reveal-delay", `${(index % 3) * 55}ms`);
          }
          revealObserver.observe(element);
        });
      } else {
        revealTargets.forEach((element) => element.classList.add("is-visible"));
      }

      document.querySelector("#price .price-note")?.remove();

      document.querySelectorAll(".horizontal-gallery").forEach((gallery) => {
        const section = gallery.closest("section");
        if (!section) return;
        const controlScope =
          gallery.closest(".sample-category, .work-image-column") || section;
        const controls = controlScope.querySelector(".gallery-controls");
        const previous = controlScope.querySelector(".gallery-prev");
        const next = controlScope.querySelector(".gallery-next");
        const total = gallery.children.length;
        const counter = document.createElement("span");
        counter.className = "gallery-counter";
        counter.textContent = `1/${total}`;

        controls?.querySelector("p")?.remove();
        const buttonGroup = controls?.querySelector("div");
        if (previous) previous.textContent = "<";
        if (next) next.textContent = ">";
        if (buttonGroup && next) buttonGroup.insertBefore(counter, next);
        if (controls) gallery.after(controls);

        const updateCounter = () => {
          const firstCard = gallery.firstElementChild;
          if (!firstCard) return;
          const gap = parseFloat(getComputedStyle(gallery).gap) || 0;
          const distance = firstCard.getBoundingClientRect().width + gap;
          const current = Math.min(
            total,
            Math.max(1, Math.round(gallery.scrollLeft / distance) + 1),
          );
          counter.textContent = `${current}/${total}`;
        };

        const move = (direction) => {
          const firstCard = gallery.firstElementChild;
          if (!firstCard) return;
          const gap = parseFloat(getComputedStyle(gallery).gap) || 0;
          const distance = firstCard.getBoundingClientRect().width + gap;
          gallery.scrollBy({ left: direction * distance, behavior: "smooth" });
        };

        previous?.addEventListener("click", () => move(-1));
        next?.addEventListener("click", () => move(1));
        gallery.addEventListener("scroll", updateCounter, { passive: true });
      });
    
