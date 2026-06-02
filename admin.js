(function () {
  const siteKey = "neoBraveSiteData";
  const defaultData = window.NEO_BRAVE_DEFAULT_DATA || {};
  let siteData = ensureInstagram(loadData());

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

  function init() {
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

  init();
})();
