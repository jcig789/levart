/**
 * Inline calendar picker — expands in place, no floating dropdown.
 * Modal grows naturally to contain it.
 */

// Module-level registry — cleared when a picker is destroyed to avoid stale refs
let activeClose: (() => void) | null = null;

export function createCalendarPicker(
	container: HTMLElement,
	initialValue: string,
	onChange: (value: string) => void
): HTMLElement {
	let selected: Date | null = initialValue ? new Date(initialValue + "T00:00:00") : null;
	const today = new Date();
	let viewYear = selected ? selected.getFullYear() : today.getFullYear();
	let viewMonth = selected ? selected.getMonth() : today.getMonth();
	let isOpen = false;

	const wrap = container.createDiv({ cls: "lv-cal-wrap" });
	const trigger = wrap.createDiv({ cls: "lv-cal-trigger" });
	const calendarEl = wrap.createDiv({ cls: "lv-cal-inline" });
	calendarEl.style.display = "none";

	updateTriggerText();

	trigger.addEventListener("click", (e) => {
		e.stopPropagation();
		if (isOpen) close(); else open();
	});

	function open() {
		if (activeClose && activeClose !== close) activeClose();
		isOpen = true;
		activeClose = close;
		calendarEl.style.display = "block";
		renderCalendar();
	}

	function close() {
		isOpen = false;
		calendarEl.style.display = "none";
		if (activeClose === close) activeClose = null;
	}

	// Close on outside click — use AbortController so listener is removed when wrap is destroyed
	const clickAbort = new AbortController();
	document.addEventListener("click", (e) => {
		if (isOpen && !wrap.contains(e.target as Node)) close();
	}, { signal: clickAbort.signal });

	// Clean up when the wrap element is removed from the DOM
	const destroyObserver = new MutationObserver(() => {
		if (!document.contains(wrap)) {
			clickAbort.abort();
			if (activeClose === close) activeClose = null;
			destroyObserver.disconnect();
		}
	});
	destroyObserver.observe(document.body, { childList: true, subtree: true });

	function updateTriggerText() {
		trigger.textContent = selected
			? selected.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
			: "Select a date";
		trigger.toggleClass("lv-cal-trigger-empty", !selected);
	}

	function renderCalendar() {
		calendarEl.empty();

		// Header
		const header = calendarEl.createDiv({ cls: "lv-cal-header" });

		const prev = header.createDiv({ cls: "lv-cal-nav" });
		prev.textContent = "←";
		prev.addEventListener("click", (e) => {
			e.stopPropagation();
			viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
			renderCalendar();
		});

		header.createDiv({ cls: "lv-cal-month-label" }).textContent =
			new Date(viewYear, viewMonth, 1)
				.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
				.toUpperCase();

		const next = header.createDiv({ cls: "lv-cal-nav" });
		next.textContent = "→";
		next.addEventListener("click", (e) => {
			e.stopPropagation();
			viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
			renderCalendar();
		});

		// Day labels
		const dh = calendarEl.createDiv({ cls: "lv-cal-days-header" });
		["Mo","Tu","We","Th","Fr","Sa","Su"].forEach(d => dh.createDiv({ cls: "lv-cal-day-label", text: d }));

		// Grid
		const grid = calendarEl.createDiv({ cls: "lv-cal-grid" });
		const first = new Date(viewYear, viewMonth, 1);
		const last = new Date(viewYear, viewMonth + 1, 0);
		let offset = first.getDay() - 1; if (offset < 0) offset = 6;

		for (let i = 0; i < offset; i++) grid.createDiv({ cls: "lv-cal-cell lv-cal-empty" });

		for (let d = 1; d <= last.getDate(); d++) {
			const dt = new Date(viewYear, viewMonth, d);
			const cell = grid.createDiv({ cls: "lv-cal-cell" });
			cell.textContent = String(d);
			if (sameDay(dt, today)) cell.addClass("lv-cal-today");
			if (selected && sameDay(dt, selected)) cell.addClass("lv-cal-selected");
			cell.addEventListener("click", (e) => {
				e.stopPropagation();
				selected = dt;
				onChange(toISO(dt));
				updateTriggerText();
				close();
			});
		}
	}

	function sameDay(a: Date, b: Date) {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}
	function toISO(d: Date) {
		return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
	}

	return wrap;
}
