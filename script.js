(function () {
  const siteKey = "neoBraveSiteData";
  const reactionKey = "neoBraveReviewReactions";
  const defaultData = window.NEO_BRAVE_DEFAULT_DATA || {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadJson(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function getPath(source, path) {
    return path.split(".").reduce((value, key) => (value ? value[key] : undefined), source);
  }

  function loadSiteData() {
    const stored = loadJson(siteKey, null);
    return ensureInstagram(stored ? { ...clone(defaultData), ...stored } : clone(defaultData));
  }

  function ensureInstagram(data) {
    const contacts = Array.isArray(data.contacts) ? data.contacts : [];
    const hasInstagram = contacts.some((contact) => String(contact.href || "").includes("instagram.com/neobrave_kr"));
    if (!hasInstagram) {
      contacts.splice(Math.max(0, contacts.length - 1), 0, {
        label: "Instagram @neobrave_kr",
        href: "https://www.instagram.com/neobrave_kr/"
      });
    }
    data.contacts = contacts;
    return data;
  }

  function renderBoundText(data) {
    document.querySelectorAll("[data-bind]").forEach((element) => {
      const value = getPath(data, element.dataset.bind);
      if (typeof value === "string") {
        element.textContent = value;
      }
    });
  }

  function renderContacts(data) {
    const list = document.querySelector("[data-contact-list]");
    if (!list) return;

    list.replaceChildren(
      ...data.contacts.map((contact) => {
        const link = document.createElement("a");
        link.href = contact.href || "#";
        link.textContent = contact.label || "링크";
        if (link.href.startsWith("http")) {
          link.target = "_blank";
          link.rel = "noreferrer";
        }
        return link;
      })
    );
  }

  function getReactionDelta(reviewId, action) {
    const reactions = loadJson(reactionKey, {});
    return reactions[reviewId] === action ? 1 : 0;
  }

  function renderReviews(data) {
    const board = document.querySelector("[data-review-list]");
    if (!board) return;

    const reviews = Array.isArray(data.reviews) ? data.reviews : [];
    if (!reviews.length) {
      board.innerHTML = '<article class="review-card"><span class="card-label">Empty</span><h3>아직 등록된 리뷰가 없습니다.</h3><p>관리창에서 첫 리뷰를 추가하세요.</p></article>';
      return;
    }

    board.replaceChildren(
      ...reviews.map((review) => {
        const card = document.createElement("article");
        const userReaction = loadJson(reactionKey, {})[review.id];
        const likeCount = Number(review.likes || 0) + getReactionDelta(review.id, "like");
        const dislikeCount = Number(review.dislikes || 0) + getReactionDelta(review.id, "dislike");
        card.className = "review-card reveal-card";

        const top = document.createElement("div");
        top.className = "review-card-top";

        const category = document.createElement("span");
        category.className = "card-label";
        category.textContent = review.category || "Review";

        const tag = document.createElement("span");
        tag.className = "review-tag";
        tag.textContent = review.tag || "기록";

        const title = document.createElement("h3");
        title.textContent = review.title || "제목 없음";

        const summary = document.createElement("p");
        summary.textContent = review.summary || "내용을 준비 중입니다.";

        const reactions = document.createElement("div");
        reactions.className = "reaction-row";
        reactions.setAttribute("aria-label", "리뷰 반응");

        const like = createReactionButton("like", "좋아요", likeCount, review.id, userReaction);
        const dislike = createReactionButton("dislike", "싫어요", dislikeCount, review.id, userReaction);

        top.append(category, tag);
        reactions.append(like, dislike);
        card.append(top, title, summary, reactions);
        return card;
      })
    );
  }

  function createReactionButton(action, label, count, reviewId, userReaction) {
    const button = document.createElement("button");
    button.className = `reaction-button ${action === "dislike" ? "dislike" : ""} ${userReaction === action ? "is-active" : ""}`.trim();
    button.type = "button";
    button.dataset.reviewId = reviewId;
    button.dataset.reaction = action;
    button.setAttribute("aria-label", `${label} ${count}`);

    const text = document.createElement("span");
    text.setAttribute("aria-hidden", "true");
    text.textContent = label;

    const value = document.createElement("strong");
    value.textContent = String(count);

    button.append(text, value);
    return button;
  }

  function bindReactions() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reaction]");
      if (!button) return;

      const reactions = loadJson(reactionKey, {});
      const reviewId = button.dataset.reviewId;
      const action = button.dataset.reaction;

      if (reactions[reviewId] === action) {
        delete reactions[reviewId];
      } else {
        reactions[reviewId] = action;
      }

      localStorage.setItem(reactionKey, JSON.stringify(reactions));
      renderReviews(loadSiteData());
    });
  }

  function revealOnScroll() {
    const targets = document.querySelectorAll(".review-card, .feature-card, .mini-card, .timeline-item");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    targets.forEach((target) => observer.observe(target));
  }

  function init() {
    const data = loadSiteData();
    renderBoundText(data);
    renderContacts(data);
    renderReviews(data);
    bindReactions();
    revealOnScroll();
  }

  init();
})();
