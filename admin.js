(function () {
  const siteKey = "neoBraveSiteData";
  const authHashKey = "neoBraveAdminCodeHash";
  const authSessionKey = "neoBraveAdminUnlocked";
  const defaultData = window.NEO_BRAVE_DEFAULT_DATA || {};
  let siteData = ensureInstagram(loadData());
  let adminReady = false;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadData() {
    try {
      const stored = localStorage.getItem(siteKey);
      return stored ? JSON.parse(stored) : clone(defaultData);
    } catch (_error) {
      return clone(defaultData);
    }
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

  function saveData() {
    localStorage.setItem(siteKey, JSON.stringify(siteData));
  }

  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  async function hashValue(value) {
    if (!window.crypto || !crypto.subtle || typeof TextEncoder === "undefined") {
      return fallbackHash(value);
    }

    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function fallbackHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fallback-${(hash >>> 0).toString(16)}`;
  }

  function setAuthMessage(message, isError = false) {
    const status = $("[data-admin-auth-status]");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  }

  function showAdmin() {
    $("[data-admin-login]").hidden = true;
    $("[data-admin-content]").hidden = false;
    document.querySelectorAll("[data-admin-private]").forEach((item) => {
      item.hidden = false;
    });
    $("[data-admin-auth-toggle]").textContent = "로그아웃";
    document.body.classList.remove("admin-locked");
    document.body.classList.add("admin-unlocked");
    initAdmin();
  }

  function showLogin() {
    $("[data-admin-login]").hidden = false;
    $("[data-admin-content]").hidden = true;
    document.querySelectorAll("[data-admin-private]").forEach((item) => {
      item.hidden = true;
    });
    $("[data-admin-auth-toggle]").textContent = "로그인";
    document.body.classList.add("admin-locked");
    document.body.classList.remove("admin-unlocked");
    prepareAuthScreen();
  }

  function logoutAdmin() {
    sessionStorage.removeItem(authSessionKey);
    showLogin();
    const target = `${window.location.pathname}?logout=${Date.now()}`;
    window.location.replace(target);
  }

  function prepareAuthScreen() {
    const savedHash = localStorage.getItem(authHashKey);
    const title = $("[data-admin-auth-title]");
    const copy = $("[data-admin-auth-copy]");
    const button = $("[data-admin-auth-button]");
    const reset = $("[data-admin-reset-code]");

    if (savedHash) {
      title.textContent = "관리 로그인";
      copy.textContent = "관리 코드를 입력하면 관리창이 열립니다.";
      button.textContent = "관리창 열기";
      reset.hidden = false;
      return;
    }

    title.textContent = "관리 코드 설정";
    copy.textContent = "처음 한 번 사용할 관리 코드를 정하세요. 이 브라우저에만 저장됩니다.";
    button.textContent = "코드 저장하고 열기";
    reset.hidden = true;
  }

  function bindAuth() {
    const form = $("[data-admin-auth-form]");
    if (!form) {
      initAdmin();
      return;
    }

    prepareAuthScreen();

    $("[data-admin-auth-toggle]").addEventListener("click", () => {
      if (document.body.classList.contains("admin-unlocked")) {
        logoutAdmin();
        return;
      }

      $("[data-admin-login]").scrollIntoView({ behavior: "smooth", block: "center" });
      form.elements.passcode.focus();
    });

    if (sessionStorage.getItem(authSessionKey) === "yes") {
      showAdmin();
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const passcode = String(new FormData(form).get("passcode") || "").trim();
      const savedHash = localStorage.getItem(authHashKey);

      if (passcode.length < 4) {
        setAuthMessage("관리 코드는 4글자 이상으로 입력하세요.", true);
        return;
      }

      let inputHash = "";
      try {
        inputHash = await hashValue(passcode);
      } catch (_error) {
        setAuthMessage("브라우저에서 코드를 처리하지 못했습니다. 새로고침 후 다시 시도하세요.", true);
        return;
      }

      if (!savedHash) {
        localStorage.setItem(authHashKey, inputHash);
        sessionStorage.setItem(authSessionKey, "yes");
        setAuthMessage("");
        showAdmin();
        return;
      }

      if (inputHash !== savedHash) {
        setAuthMessage("관리 코드가 맞지 않습니다.", true);
        form.elements.passcode.select();
        return;
      }

      sessionStorage.setItem(authSessionKey, "yes");
      setAuthMessage("");
      showAdmin();
    });

    $("[data-admin-reset-code]").addEventListener("click", () => {
      const ok = window.confirm("이 브라우저에 저장된 관리 코드를 지우고 새로 설정할까요?");
      if (!ok) return;

      localStorage.removeItem(authHashKey);
      sessionStorage.removeItem(authSessionKey);
      form.reset();
      prepareAuthScreen();
      setAuthMessage("관리 코드가 초기화되었습니다. 새 코드를 입력하세요.");
    });
  }

  function setBrandForm() {
    const form = $("#brand-admin");
    Object.entries(siteData.brand).forEach(([key, value]) => {
      const field = form.elements[key];
      if (field) field.value = value;
    });
  }

  function renderReviewList() {
    const list = $("[data-review-admin-list]");
    list.replaceChildren(
      ...siteData.reviews.map((review) => {
        const item = document.createElement("article");
        item.className = "admin-list-item";

        const copy = document.createElement("div");
        const title = document.createElement("strong");
        const meta = document.createElement("span");
        title.textContent = review.title;
        meta.textContent = `${review.category} · 좋아요 ${review.likes || 0} · 싫어요 ${review.dislikes || 0}`;

        const actions = document.createElement("div");
        actions.className = "admin-actions compact";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "button secondary";
        edit.dataset.editReview = review.id;
        edit.textContent = "수정";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button secondary danger";
        remove.dataset.deleteReview = review.id;
        remove.textContent = "삭제";

        copy.append(title, meta);
        actions.append(edit, remove);
        item.append(copy, actions);
        return item;
      })
    );
  }

  function setReviewForm(review) {
    const form = $("[data-review-form]");
    const data =
      review || { id: "", category: "", title: "", summary: "", tag: "", likes: 0, dislikes: 0 };
    Object.entries(data).forEach(([key, value]) => {
      const field = form.elements[key];
      if (field) field.value = value;
    });
  }

  function renderContacts() {
    const list = $("[data-contact-admin-list]");
    list.replaceChildren(
      ...siteData.contacts.map((contact, index) => {
        const item = document.createElement("div");
        item.className = "contact-editor";

        const labelWrap = document.createElement("label");
        const labelInput = document.createElement("input");
        labelInput.type = "text";
        labelInput.value = contact.label || "";
        labelInput.dataset.contactLabel = String(index);
        labelWrap.append("표시 이름", labelInput);

        const hrefWrap = document.createElement("label");
        const hrefInput = document.createElement("input");
        hrefInput.type = "text";
        hrefInput.value = contact.href || "";
        hrefInput.dataset.contactHref = String(index);
        hrefWrap.append("주소", hrefInput);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button secondary danger";
        remove.dataset.deleteContact = String(index);
        remove.textContent = "삭제";

        item.append(labelWrap, hrefWrap, remove);
        return item;
      })
    );
  }

  function bindBrandForm() {
    const form = $("#brand-admin");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      Object.keys(siteData.brand).forEach((key) => {
        const field = form.elements[key];
        if (field) siteData.brand[key] = field.value.trim();
      });
      saveData();
      alert("브랜드 문구를 저장했습니다.");
    });
  }

  function bindReviewForm() {
    const form = $("[data-review-form]");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const id = formData.get("id") || `review-${Date.now()}`;
      const review = {
        id,
        category: String(formData.get("category") || "Review").trim(),
        title: String(formData.get("title") || "제목 없음").trim(),
        summary: String(formData.get("summary") || "").trim(),
        tag: String(formData.get("tag") || "기록").trim(),
        likes: Number(formData.get("likes") || 0),
        dislikes: Number(formData.get("dislikes") || 0)
      };

      const index = siteData.reviews.findIndex((item) => item.id === id);
      if (index >= 0) siteData.reviews[index] = review;
      else siteData.reviews.unshift(review);

      saveData();
      setReviewForm();
      renderReviewList();
      alert("리뷰를 저장했습니다. 댓글 기능은 추가되지 않습니다.");
    });

    $("[data-clear-review]").addEventListener("click", () => setReviewForm());
  }

  function bindReviewList() {
    document.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-edit-review]");
      const deleteButton = event.target.closest("[data-delete-review]");

      if (editButton) {
        const review = siteData.reviews.find((item) => item.id === editButton.dataset.editReview);
        if (review) setReviewForm(review);
      }

      if (deleteButton) {
        siteData.reviews = siteData.reviews.filter((item) => item.id !== deleteButton.dataset.deleteReview);
        saveData();
        renderReviewList();
      }
    });
  }

  function bindContacts() {
    document.addEventListener("input", (event) => {
      const labelIndex = event.target.dataset.contactLabel;
      const hrefIndex = event.target.dataset.contactHref;

      if (labelIndex !== undefined) {
        siteData.contacts[Number(labelIndex)].label = event.target.value;
        saveData();
      }

      if (hrefIndex !== undefined) {
        siteData.contacts[Number(hrefIndex)].href = event.target.value;
        saveData();
      }
    });

    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-contact]");
      const deleteButton = event.target.closest("[data-delete-contact]");

      if (addButton) {
        siteData.contacts.push({ label: "새 링크", href: "#" });
        saveData();
        renderContacts();
      }

      if (deleteButton) {
        siteData.contacts.splice(Number(deleteButton.dataset.deleteContact), 1);
        saveData();
        renderContacts();
      }
    });
  }

  function bindDataTools() {
    const box = $("[data-data-box]");

    $("[data-export-data]").addEventListener("click", () => {
      box.value = JSON.stringify(siteData, null, 2);
    });

    $("[data-import-data]").addEventListener("click", () => {
      try {
        siteData = JSON.parse(box.value);
        saveData();
        setBrandForm();
        renderReviewList();
        renderContacts();
        alert("붙여넣은 데이터를 적용했습니다.");
      } catch (_error) {
        alert("데이터 형식을 확인해주세요.");
      }
    });

    $("[data-reset-data]").addEventListener("click", () => {
      siteData = clone(defaultData);
      saveData();
      setBrandForm();
      renderReviewList();
      renderContacts();
      box.value = "";
      alert("초기값으로 되돌렸습니다.");
    });
  }

  function initAdmin() {
    if (adminReady) return;
    adminReady = true;
    setBrandForm();
    setReviewForm();
    renderReviewList();
    renderContacts();
    bindBrandForm();
    bindReviewForm();
    bindReviewList();
    bindContacts();
    bindDataTools();
  }

  bindAuth();
})();
