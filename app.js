(function () {
  const data = window.GRADE_DASHBOARD_DATA || { cohorts: [], skipped: [] };
  const cohortSelect = document.getElementById("cohortSelect");
  const totalStudents = document.getElementById("totalStudents");
  const matchedStudents = document.getElementById("matchedStudents");
  const targetPlanStudents = document.getElementById("targetPlanStudents");
  const matchedPercent = document.getElementById("matchedPercent");
  const chartTitle = document.getElementById("chartTitle");
  const cohortMeta = document.getElementById("cohortMeta");
  const chartDescription = document.getElementById("chartDescription");
  const gradeChart = document.getElementById("gradeChart");
  const gradeTable = document.getElementById("gradeTable");
  const generatedAt = document.getElementById("generatedAt");
  const skippedYears = document.getElementById("skippedYears");
  const totalLegend = document.getElementById("totalLegend");
  const matchedLegend = document.getElementById("matchedLegend");
  const targetPlanLegend = document.getElementById("targetPlanLegend");
  const sourceCourseLabel = "ENGGEN121";
  const targetCourseLabel = "CIVIL";
  const targetPlanLabel = "STRCT";

  function formatNumber(value) {
    return new Intl.NumberFormat("en-NZ").format(value);
  }

  function formatPercent(value) {
    return `${Number(value).toFixed(1)}%`;
  }

  function svgEl(name, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function renderChart(cohort) {
    const width = 1120;
    const height = 520;
    const margin = { top: 34, right: 24, bottom: 62, left: 58 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxTotal = Math.max(1, ...cohort.grades.map((grade) => grade.total));
    const yMax = Math.ceil(maxTotal / 25) * 25;
    const barGap = 18;
    const barWidth = (plotWidth - barGap * (cohort.grades.length - 1)) / cohort.grades.length;

    gradeChart.replaceChildren();
    gradeChart.setAttribute("viewBox", `0 0 ${width} ${height}`);

    for (let tick = 0; tick <= yMax; tick += 25) {
      const y = margin.top + plotHeight - (tick / yMax) * plotHeight;
      gradeChart.appendChild(svgEl("line", {
        x1: margin.left,
        y1: y,
        x2: width - margin.right,
        y2: y,
        class: "grid-line",
      }));
      gradeChart.appendChild(svgEl("text", {
        x: margin.left - 12,
        y: y + 4,
        "text-anchor": "end",
        class: "axis-text",
      })).textContent = tick;
    }

    cohort.grades.forEach((grade, index) => {
      const x = margin.left + index * (barWidth + barGap);
      const targetPlan = grade.targetPlan || 0;
      const totalHeight = (grade.total / yMax) * plotHeight;
      const matchedHeight = (grade.matched / yMax) * plotHeight;
      const targetPlanHeight = (targetPlan / yMax) * plotHeight;
      const totalY = margin.top + plotHeight - totalHeight;
      const matchedY = margin.top + plotHeight - matchedHeight;
      const targetPlanY = margin.top + plotHeight - targetPlanHeight;

      const totalRect = svgEl("rect", {
        x,
        y: totalY,
        width: barWidth,
        height: Math.max(0, totalHeight),
        fill: "var(--unmatched)",
      });
      totalRect.appendChild(svgEl("title")).textContent = `${grade.grade}: ${grade.total} ${cohort.sourceCourse} students`;
      gradeChart.appendChild(totalRect);

      const matchedWidth = barWidth * 0.68;
      const matchedRect = svgEl("rect", {
        x: x + (barWidth - matchedWidth) / 2,
        y: matchedY,
        width: matchedWidth,
        height: Math.max(0, matchedHeight),
        fill: "var(--matched)",
      });
      matchedRect.appendChild(svgEl("title")).textContent = `${grade.grade}: ${grade.matched} CIVIL + ${targetPlanLabel} cohort students (${formatPercent(grade.percent)})`;
      gradeChart.appendChild(matchedRect);

      if (targetPlan > 0) {
        const targetPlanWidth = barWidth * 0.38;
        const targetPlanRect = svgEl("rect", {
          x: x + (barWidth - targetPlanWidth) / 2,
          y: targetPlanY,
          width: targetPlanWidth,
          height: Math.max(0, targetPlanHeight),
          fill: "var(--target-plan)",
        });
        targetPlanRect.appendChild(svgEl("title")).textContent = `${grade.grade}: ${targetPlan} ${targetPlanLabel} cohort students`;
        gradeChart.appendChild(targetPlanRect);
      }

      gradeChart.appendChild(svgEl("text", {
        x: x + barWidth / 2,
        y: totalY - 9,
        "text-anchor": "middle",
        class: "value-text",
      })).textContent = grade.total || "";

      if (grade.matched > 0) {
        const labelClass = matchedHeight >= 38 ? "match-text" : "match-text-small";
        const labelY = targetPlan > 0 || matchedHeight < 38 ? matchedY - 20 : matchedY + matchedHeight / 2 - 2;
        const firstLine = svgEl("text", {
          x: x + barWidth / 2,
          y: labelY,
          "text-anchor": "middle",
          class: targetPlan > 0 ? "match-text-small" : labelClass,
        });
        firstLine.textContent = grade.matched;
        gradeChart.appendChild(firstLine);

        const secondLine = svgEl("text", {
          x: x + barWidth / 2,
          y: labelY + 15,
          "text-anchor": "middle",
          class: targetPlan > 0 ? "match-text-small" : labelClass,
        });
        secondLine.textContent = `${Math.round(grade.percent)}%`;
        gradeChart.appendChild(secondLine);
      }

      if (targetPlan > 0) {
        const planLabelClass = targetPlanHeight >= 26 ? "plan-text" : "plan-text-small";
        const planLabelY = targetPlanHeight >= 26 ? targetPlanY + targetPlanHeight / 2 + 4 : targetPlanY - 5;
        gradeChart.appendChild(svgEl("text", {
          x: x + barWidth / 2,
          y: planLabelY,
          "text-anchor": "middle",
          class: planLabelClass,
        })).textContent = targetPlan;
      }

      gradeChart.appendChild(svgEl("text", {
        x: x + barWidth / 2,
        y: height - 26,
        "text-anchor": "middle",
        class: "grade-text",
      })).textContent = grade.grade;
    });
  }

  function renderTable(cohort) {
    gradeTable.replaceChildren();
    cohort.grades.forEach((grade) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${grade.grade}</td>
        <td>${formatNumber(grade.total)}</td>
        <td>${formatNumber(grade.matched)}</td>
        <td>${formatNumber(grade.targetPlan || 0)}</td>
        <td>${formatNumber(grade.matchedOther ?? Math.max(0, grade.matched - (grade.targetPlan || 0)))}</td>
        <td>${formatNumber(grade.notMatched)}</td>
        <td>${formatPercent(grade.percent)}</td>
      `;
      gradeTable.appendChild(row);
    });
  }

  function renderSkipped() {
    if (!data.skipped || data.skipped.length === 0) {
      skippedYears.textContent = "";
      return;
    }
    const years = data.skipped.map((cohort) => `${cohort.enggenYear}->${cohort.civilYear}`).join(", ");
    skippedYears.textContent = `Skipped cohorts without usable following-year ${data.targetCourse || "CIVIL 203"} data: ${years}.`;
  }

  function renderCohort(cohort) {
    totalStudents.textContent = formatNumber(cohort.totalStudents);
    matchedStudents.textContent = formatNumber(cohort.matchedStudents);
    targetPlanStudents.textContent = formatNumber(cohort.targetPlanStudents || 0);
    matchedPercent.textContent = formatPercent(cohort.matchedPercent);
    chartTitle.textContent = `${cohort.sourceCourse} ${cohort.enggenYear} matched to ${cohort.targetCourse} ${cohort.civilYear}`;
    cohortMeta.textContent = `Source: ${cohort.enggenFile} -> ${cohort.civilFile}`;
    chartDescription.textContent = `${cohort.matchedStudents} of ${cohort.totalStudents} ${cohort.sourceCourse} students were found in ${cohort.targetCourse}.`;
    totalLegend.textContent = `${sourceCourseLabel} grades for ${cohort.enggenYear}`;
    matchedLegend.textContent = `${targetCourseLabel} + ${targetPlanLabel} Cohort ${cohort.civilYear}`;
    targetPlanLegend.textContent = `${targetPlanLabel} Cohort ${cohort.civilYear}`;
    generatedAt.textContent = data.generatedAt ? `Data generated ${data.generatedAt}` : "";
    renderChart(cohort);
    renderTable(cohort);
  }

  function init() {
    if (!data.cohorts || data.cohorts.length === 0) {
      cohortSelect.innerHTML = "<option>No matched cohorts available</option>";
      totalStudents.textContent = "0";
      matchedStudents.textContent = "0";
      targetPlanStudents.textContent = "0";
      matchedPercent.textContent = "0.0%";
      cohortMeta.textContent = `Add following-year ${data.targetCourse || "CIVIL 203"} files, then regenerate the dashboard data.`;
      renderSkipped();
      return;
    }

    data.cohorts.forEach((cohort) => {
      const option = document.createElement("option");
      option.value = String(cohort.enggenYear);
      option.textContent = `${cohort.enggenYear} -> ${cohort.civilYear}`;
      cohortSelect.appendChild(option);
    });

    cohortSelect.addEventListener("change", () => {
      const selectedYear = Number(cohortSelect.value);
      const cohort = data.cohorts.find((item) => item.enggenYear === selectedYear);
      if (cohort) {
        renderCohort(cohort);
      }
    });

    renderCohort(data.cohorts[data.cohorts.length - 1]);
    cohortSelect.value = String(data.cohorts[data.cohorts.length - 1].enggenYear);
    renderSkipped();
  }

  init();
})();
