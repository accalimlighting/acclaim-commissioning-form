(function () {
  function getValue(form, name) {
    var element = form.elements.namedItem(name);
    if (!element) return "";
    if (element instanceof RadioNodeList) return element.value || "";
    if ("value" in element) return element.value || "";
    return "";
  }

  function setMessage(container, text, kind) {
    if (!container) return;
    container.textContent = text || "";
    container.classList.remove("is-success", "is-error");
    if (kind === "success") container.classList.add("is-success");
    if (kind === "error") container.classList.add("is-error");
  }

  async function onSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.reportValidity()) return;

    var endpoint = form.getAttribute("data-endpoint");
    if (!endpoint) return;

    var button = form.querySelector('button[type="submit"]');
    var message = form.querySelector(".js-acclaim-message");
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = "Submitting...";
    }
    setMessage(message, "");

    var payload = {
      jobName: getValue(form, "jobName").trim(),
      purchaseOrder: getValue(form, "purchaseOrder").trim(),
      siteAddress: getValue(form, "siteAddress").trim(),
      contactName: getValue(form, "contactName").trim(),
      contactEmail: getValue(form, "contactEmail").trim(),
      contactPhone: getValue(form, "contactPhone").trim(),
      drawingLink: getValue(form, "drawingLink").trim(),
      programmingNarrative: getValue(form, "programmingNarrative").trim(),
      fixturesOperable: getValue(form, "fixturesOperable"),
      wiringNotes: getValue(form, "wiringNotes").trim(),
      additionalNotes: getValue(form, "additionalNotes").trim()
    };

    var dmxRaw = getValue(form, "dmxAccessAvailable");
    if (dmxRaw === "true") payload.dmxAccessAvailable = true;
    if (dmxRaw === "false") payload.dmxAccessAvailable = false;

    try {
      var response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      var data = await response.json().catch(function () {
        return {};
      });
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit form.");
      }

      form.reset();
      setMessage(message, "Submitted successfully.", "success");
    } catch (error) {
      var text = error instanceof Error ? error.message : "Unable to submit form.";
      setMessage(message, text, "error");
    } finally {
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
        button.textContent = "Submit form";
      }
    }
  }

  function init() {
    var forms = document.querySelectorAll(".js-acclaim-commissioning-form");
    forms.forEach(function (form) {
      form.addEventListener("submit", onSubmit);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
