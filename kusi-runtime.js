const form = document.getElementById("commissionForm");
      const lensDetails = document.getElementById("lensDetails");
      const copyOutput = document.getElementById("copyOutput");
      const copyStatus = document.getElementById("copyStatus");
      const confirmCount = document.getElementById("confirmCount");
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
        const total = items.reduce((sum, item) => sum + item.price, 0);
        document.getElementById("estimatePrice").textContent = won(total);
        const hasLensProduct = items.some(
          (item) =>
            (item.input.name === "setProduct" ||
              item.input.name === "singleProduct") &&
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
              total: Math.max(
                0,
                allSelected().reduce((sum, item) => sum + item.price, 0),
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
        return `[3D 버츄얼 얼굴 · 렌즈 원화 신청서]\n\n닉네임 / 입금자명 : ${value("appName")}\n캐릭터 자료 링크 : ${value("appLink")}\n\n상담 선택\n${consults.length ? consults.map(line).join("\n") : "· 선택 없음"}\n\n신청 상품 및 옵션\n${products.length ? products.map(line).join("\n") : "· 선택 없음"}\n\n예상 견적 : ${won(result.total)}\n희망 마감일 : ${value("appDeadline")}\n사용 용도 : ${value("appUse")}\n원하는 분위기·참고 자료 : ${value("appStyle")}${lensLine}\n기타 요청사항 : ${value("appEtc")}`;
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
        document.body.append(aura);
        let auraFrame = 0;
        let pointerX = 0;
        let pointerY = 0;
        document.addEventListener("pointermove", (event) => {
          if (event.pointerType && event.pointerType !== "mouse") return;
          pointerX = event.clientX;
          pointerY = event.clientY;
          aura.style.opacity = ".9";
          if (auraFrame) return;
          auraFrame = requestAnimationFrame(() => {
            aura.style.transform = `translate3d(${pointerX - 95}px,${pointerY - 95}px,0)`;
            auraFrame = 0;
          });
        }, { passive: true });
        document.documentElement.addEventListener("mouseleave", () => (aura.style.opacity = "0"));
        document.addEventListener("click", (event) => {
          for (let index = 0; index < 9; index += 1) {
            const spark = document.createElement("i");
            const angle = (Math.PI * 2 * index) / 9 + Math.random() * .28;
            const distance = 24 + Math.random() * 42;
            spark.className = "kusi-spark";
            spark.style.left = event.clientX + "px";
            spark.style.top = event.clientY + "px";
            spark.style.setProperty("--spark-x", Math.cos(angle) * distance + "px");
            spark.style.setProperty("--spark-y", Math.sin(angle) * distance + "px");
            spark.style.animationDelay = index * 12 + "ms";
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
      calculate();

      const creatorCard = document.querySelector("#creator .creator-card");
      if (creatorCard) {
        creatorCard.classList.add("kusi-artist-intro");
        creatorCard.innerHTML = `
          <div class="creator-visual" aria-label="Kusi 대표 이미지 영역">
            <span>KUSI<small>ARTIST</small></span>
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
      if (applicationForm && !document.getElementById("applicationPriceGuide")) {
        const priceGuide = document.createElement("div");
        priceGuide.id = "applicationPriceGuide";
        priceGuide.className = "application-price-guide";
        priceGuide.innerHTML = `
          <div class="application-price-title"><b>신청 가격표</b><span>선택한 금액은 아래 예상 견적에 자동 합산됩니다.</span></div>
          <div class="application-price-row"><span>기본 세트</span><b>고급 헤드 원화 + 렌즈</b><strong>80,000원</strong></div>
          <div class="application-price-row"><span>기본 세트</span><b>오마카세 헤드 원화 + 렌즈</b><strong>90,000원</strong></div>
          <div class="application-price-row"><span>단일 구성</span><b>고급 헤드 원화 PNG</b><strong>50,000원</strong></div>
          <div class="application-price-row"><span>단일 구성</span><b>오마카세 헤드 원화 PNG</b><strong>55,000원</strong></div>
          <div class="application-price-row"><span>단일 구성</span><b>렌즈 PSD</b><strong>50,000원</strong></div>
          <div class="application-price-row"><span>단일 구성</span><b>렌즈 PNG</b><strong>40,000원</strong></div>
          <div class="application-price-row"><span>추가금</span><b>컨펌 추가</b><strong>회당 3,000원</strong></div>
          <div class="application-price-row"><span>추가금</span><b>퀄리티 업</b><strong>20,000원</strong></div>
          <div class="application-price-row"><span>비공개</span><b>일주일 / 한 달 / 영구</b><strong>5,000 / 10,000 / 50,000원</strong></div>`;
        applicationForm.before(priceGuide);
      }

      const reveals = document.querySelectorAll(".reveal");
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
        reveals.forEach((element, index) => {
          element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
          revealObserver.observe(element);
        });
      } else {
        reveals.forEach((element) => element.classList.add("is-visible"));
      }

      document.querySelector("#price .price-note")?.remove();

      document.querySelectorAll(".horizontal-gallery").forEach((gallery) => {
        const section = gallery.closest("section");
        if (!section) return;
        const controls = section.querySelector(".gallery-controls");
        const previous = section.querySelector(".gallery-prev");
        const next = section.querySelector(".gallery-next");
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
    
