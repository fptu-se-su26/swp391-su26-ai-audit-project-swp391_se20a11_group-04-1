package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.example.backend.entity.Priority;
import org.example.backend.entity.Sprint;
import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.impl.TaskServiceImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectTrackingExportService {

    private static final DateTimeFormatter DATE_FMT     = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final ProjectRepository projectRepository;
    private final TaskRepository    taskRepository;
    private final SprintRepository  sprintRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // Public entry point
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public org.example.backend.dto.ProjectTrackingResponse getProjectTrackingData(Long projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy project."));

        List<Task>   allTasks = taskRepository.findAllWithAssigneeByProjectId(projectId);

        // Pre-compute display values for every task
        Map<Long, DisplayValues> displayMap = new HashMap<>();
        for (Task t : allTasks) {
            displayMap.put(t.getId(), computeDisplay(t));
        }

        // Total project points (sum of all DONE tasks)
        double totalProjectPoints = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .mapToDouble(t -> displayMap.get(t.getId()).taskPoints)
                .sum();

        Map<String, List<Task>> byMember = allTasks.stream()
                .collect(Collectors.groupingBy(this::assigneeName, TreeMap::new, Collectors.toList()));

        List<org.example.backend.dto.ProjectTrackingResponse.MemberSummary> members = new ArrayList<>();
        double totalActualHours = 0;

        for (Map.Entry<String, List<Task>> entry : byMember.entrySet()) {
            List<Task> mt = entry.getValue();
            long done      = mt.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
            long cancelled = mt.stream().filter(t -> t.getStatus() == TaskStatus.CANCELLED).count();

            long onTime = mt.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE
                            && t.getCompletedAt() != null && t.getDeadline() != null
                            && !t.getCompletedAt().toLocalDate().isAfter(t.getDeadline()))
                    .count();

            double completionPct = mt.isEmpty() ? 0 : (done * 100.0 / mt.size());
            double onTimePct     = done == 0 ? 0 : (onTime * 100.0 / done);

            double totalEst = mt.stream()
                    .filter(t -> t.getEstimatedHours() != null)
                    .mapToDouble(t -> t.getEstimatedHours().doubleValue()).sum();
            double totalAct = mt.stream()
                    .map(t -> displayMap.get(t.getId()).actualHours)
                    .filter(Objects::nonNull)
                    .mapToDouble(BigDecimal::doubleValue).sum();

            totalActualHours += totalAct;

            OptionalDouble avgQ = mt.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE)
                    .mapToDouble(t -> displayMap.get(t.getId()).qualityScore)
                    .filter(q -> q > 0).average();

            double memberPoints = mt.stream()
                    .filter(t -> t.getStatus() == TaskStatus.DONE)
                    .mapToDouble(t -> displayMap.get(t.getId()).taskPoints).sum();

            double contrib = totalProjectPoints > 0 ? (memberPoints / totalProjectPoints * 100) : 0;

            members.add(new org.example.backend.dto.ProjectTrackingResponse.MemberSummary(
                    entry.getKey(),
                    mt.size(),
                    (int) done,
                    (int) cancelled,
                    Math.round(completionPct * 10) / 10.0,
                    Math.round(onTimePct * 10) / 10.0,
                    Math.round(totalEst * 100) / 100.0,
                    Math.round(totalAct * 100) / 100.0,
                    avgQ.isPresent() ? Math.round(avgQ.getAsDouble() * 10) / 10.0 : 0.0,
                    Math.round(memberPoints * 100) / 100.0,
                    Math.round(contrib * 10) / 10.0
            ));
        }

        int completedTasks = (int) allTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
        double projectCompletionPct = allTasks.isEmpty() ? 0 : (completedTasks * 100.0 / allTasks.size());

        long projectOnTime = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE
                        && t.getCompletedAt() != null && t.getDeadline() != null
                        && !t.getCompletedAt().toLocalDate().isAfter(t.getDeadline()))
                .count();
        double projectOnTimePct = completedTasks == 0 ? 0 : (projectOnTime * 100.0 / completedTasks);

        double projectAvgQuality = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.DONE)
                .mapToDouble(t -> displayMap.get(t.getId()).qualityScore)
                .filter(q -> q > 0)
                .average()
                .orElse(0.0);

        return new org.example.backend.dto.ProjectTrackingResponse(
                byMember.size(),
                allTasks.size(),
                completedTasks,
                Math.round(projectCompletionPct * 10) / 10.0,
                Math.round(projectOnTimePct * 10) / 10.0,
                Math.round(projectAvgQuality * 10) / 10.0,
                Math.round(totalProjectPoints * 100) / 100.0,
                Math.round(totalActualHours * 100) / 100.0,
                members
        );
    }

    @Transactional(readOnly = true)
    public byte[] exportProjectTracking(Long projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy project."));

        List<Task>   allTasks = taskRepository.findAllWithAssigneeByProjectId(projectId);
        List<Sprint> sprints  = sprintRepository.findByProjectIdOrderByStartDateAscIdAsc(projectId);

        // Pre-compute display values for every task
        Map<Long, DisplayValues> displayMap = new HashMap<>();
        for (Task t : allTasks) {
            displayMap.put(t.getId(), computeDisplay(t));
        }

        org.example.backend.dto.ProjectTrackingResponse data = getProjectTrackingData(projectId);

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Styles s = new Styles(wb);

            buildTaskSheet(wb, s, allTasks, sprints, displayMap);
            buildMemberSummarySheet(wb, s, data);
            buildFormulaSheet(wb, s);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi tạo file Excel.", e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sheet 1: Tasks (grouped by Sprint → Member → DONE first)
    // ─────────────────────────────────────────────────────────────────────────

    private void buildTaskSheet(XSSFWorkbook wb, Styles s,
                                List<Task> allTasks,
                                List<Sprint> sprints,
                                Map<Long, DisplayValues> displayMap) {

        Sheet sheet = wb.createSheet("Tasks");
        int[] widths = {2800, 8000, 5000, 3500, 3500, 4500, 2800, 2800, 3000, 3500, 2800};
        for (int i = 0; i < widths.length; i++) sheet.setColumnWidth(i, widths[i]);

        int row = 0;

        // Title
        Row titleRow = sheet.createRow(row++);
        cell(titleRow, 0, "TASK TRACKING REPORT", s.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
        row++; // blank

        // Header
        String[] headers = {"ID","Task","Member","Start Date","Actual Start","Due Date",
                "Actual Finish","Actual(h)","Quality(1-10)","Task Points","Status"};
        Row hRow = sheet.createRow(row++);
        for (int c = 0; c < headers.length; c++) cell(hRow, c, headers[c], s.header);

        // Build sprint → task map (ordered)
        Map<Long, List<Task>> bySprintId = allTasks.stream()
                .filter(t -> t.getSprintId() != null)
                .collect(Collectors.groupingBy(Task::getSprintId));

        List<Task> backlog = allTasks.stream()
                .filter(t -> t.getSprintId() == null)
                .sorted(taskComparator())
                .toList();

        // Sprints in chronological order
        for (Sprint sprint : sprints) {
            List<Task> sprintTasks = bySprintId.getOrDefault(sprint.getId(), List.of());
            if (sprintTasks.isEmpty()) continue;
            row = writeSprintGroup(sheet, s, sprint.getName(), sprintTasks, displayMap, row);
        }

        // Backlog at end
        if (!backlog.isEmpty()) {
            row = writeSprintGroup(sheet, s, "Backlog (chưa gán sprint)", backlog, displayMap, row);
        }
    }

    private int writeSprintGroup(Sheet sheet, Styles s,
                                  String sprintLabel,
                                  List<Task> tasks,
                                  Map<Long, DisplayValues> displayMap,
                                  int startRow) {
        // Sprint header row
        Row gRow = sheet.createRow(startRow++);
        cell(gRow, 0, sprintLabel, s.sprintGroup);
        sheet.addMergedRegion(new CellRangeAddress(startRow - 1, startRow - 1, 0, 10));

        // Group by member, sort DONE first within each member
        Map<String, List<Task>> byMember = tasks.stream()
                .collect(Collectors.groupingBy(this::assigneeName, LinkedHashMap::new,
                        Collectors.collectingAndThen(Collectors.toList(),
                                list -> list.stream().sorted(taskComparator()).toList())));

        for (Map.Entry<String, List<Task>> entry : byMember.entrySet()) {
            // Member sub-header
            Row mRow = sheet.createRow(startRow++);
            cell(mRow, 1, "👤 " + entry.getKey(), s.memberGroup);
            sheet.addMergedRegion(new CellRangeAddress(startRow - 1, startRow - 1, 1, 10));

            for (Task t : entry.getValue()) {
                DisplayValues dv = displayMap.get(t.getId());
                Row row = sheet.createRow(startRow++);

                String displayId = t.getTaskCode() != null ? t.getTaskCode() : "#" + t.getId();
                cell(row, 0, displayId, s.data);
                cell(row, 1, t.getTitle(), s.data);
                cell(row, 2, assigneeName(t), s.data);
                cell(row, 3, t.getStartDate() != null ? t.getStartDate().format(DATE_FMT) : "", s.data);
                cell(row, 4, t.getStartedAt() != null ? t.getStartedAt().format(DATETIME_FMT) : "", s.data);
                cell(row, 5, t.getDeadline() != null ? t.getDeadline().format(DATE_FMT) : "", s.data);
                cell(row, 6, t.getCompletedAt() != null ? t.getCompletedAt().format(DATETIME_FMT) : "", s.data);
                if (dv.actualHours != null) numCell(row, 7, dv.actualHours.doubleValue(), s.data);
                else cell(row, 7, "", s.data);

                // Quality — màu theo điểm
                CellStyle qStyle = dv.qualityScore >= 8 ? s.scoreGood
                        : dv.qualityScore >= 5 ? s.scoreMid : s.scoreBad;
                if (dv.qualityScore > 0) numCell(row, 8, dv.qualityScore, qStyle);
                else cell(row, 8, "N/A", s.data);

                numCell(row, 9, Math.round(dv.taskPoints * 100.0) / 100.0, s.data);
                cell(row, 10, t.getStatus().name(), s.data);
            }
        }
        return startRow;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sheet 2: Member Summary
    // ─────────────────────────────────────────────────────────────────────────

    private void buildMemberSummarySheet(XSSFWorkbook wb, Styles s, org.example.backend.dto.ProjectTrackingResponse data) {
        Sheet sheet = wb.createSheet("Member Summary");
        int[] widths = {6000, 2800, 2800, 2800, 3200, 3200, 3500, 3500, 3500, 3500, 4000};
        for (int i = 0; i < widths.length; i++) sheet.setColumnWidth(i, widths[i]);

        Row title = sheet.createRow(0);
        cell(title, 0, "BẢNG ĐÁNH GIÁ ĐÓNG GÓP THÀNH VIÊN", s.title);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));

        String[] headers = {"Member","Tổng tasks","Hoàn thành","Đã hủy",
                "Completion %","On-time %","Est.(h)","Actual(h)",
                "Avg Quality","Total Points","Contribution %"};
        Row hRow = sheet.createRow(2);
        for (int c = 0; c < headers.length; c++) cell(hRow, c, headers[c], s.header);

        int r = 3;
        for (org.example.backend.dto.ProjectTrackingResponse.MemberSummary m : data.members()) {
            Row row = sheet.createRow(r++);
            cell(row, 0, m.name(), s.data);
            numCell(row, 1, m.totalTasks(), s.data);
            numCell(row, 2, m.doneTasks(), s.data);
            numCell(row, 3, m.cancelledTasks(), s.data);
            pctCell(row, 4, m.completionPct(), s.data);
            pctCell(row, 5, m.onTimePct(), s.data);
            numCell(row, 6, m.estimatedHours(), s.data);
            numCell(row, 7, m.actualHours(), s.data);
            numCell(row, 8, m.avgQuality(), s.data);
            numCell(row, 9, m.totalPoints(), s.data);

            double contrib = m.contributionPct();
            CellStyle cStyle = contrib >= 30 ? s.scoreGood : contrib >= 15 ? s.scoreMid : s.scoreBad;
            pctCell(row, 10, contrib, cStyle);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Sheet 3: Công thức đánh giá
    // ─────────────────────────────────────────────────────────────────────────

    private void buildFormulaSheet(XSSFWorkbook wb, Styles s) {
        Sheet sheet = wb.createSheet("Công thức đánh giá");
        sheet.setColumnWidth(0, 500);
        sheet.setColumnWidth(1, 7000);
        sheet.setColumnWidth(2, 5500);
        sheet.setColumnWidth(3, 5000);

        int r = 0;

        r = sectionTitle(sheet, s, r, "HỆ THỐNG ĐÁNH GIÁ ĐÓNG GÓP — PHƯƠNG PHÁP LUẬN");
        r++;

        // ══════════════════════════════════════════════════════════════════════
        // NHÓM A — SHEET 1: TASKS  (theo thứ tự cột từ trái sang phải)
        // Cột formula-relevant: Actual Start | Actual(h) | Quality(1-10) | Task Points
        // ══════════════════════════════════════════════════════════════════════
        r = sectionTitle(sheet, s, r, "NHÓM A — SHEET 1: TASKS");
        r++;

        // A1. Actual Start
        r = sectionHeader(sheet, s, r, "A1. ACTUAL START — Thời điểm bắt đầu thực tế");
        r = infoRow(sheet, s, r, "Nguồn dữ liệu",
                "Trường startedAt được ghi tự động khi task chuyển sang IN_PROGRESS lần đầu tiên.");
        r = infoRow(sheet, s, r, "Lưu ý",
                "Task tạo trước khi triển khai tính năng này sẽ để trống. "
                + "Start Date (cột liền trước) là ngày kế hoạch do Leader đặt — khác với Actual Start.");
        r++;

        // A2. Actual(h)
        r = sectionHeader(sheet, s, r, "A2. ACTUAL(h) — Số giờ làm việc thực tế");
        r = tableHeader(sheet, s, r, "Trường hợp", "Công thức tính", "Độ chính xác");
        r = tableRow(sheet, s, r,
                "Có Actual Start (task mới)",
                "Actual Finish − Actual Start",
                "Chính xác — tính từ lúc thực sự bắt đầu làm");
        r = tableRow(sheet, s, r,
                "Không có Actual Start (task cũ)",
                "Actual Finish − Start Date",
                "Ước tính — Start Date là ngày kế hoạch");
        r = infoRow(sheet, s, r, "Ô trống",
                "Task chưa DONE hoặc không đủ dữ liệu để tính (không có completedAt).");
        r++;

        // A3. Quality(1-10)
        r = sectionHeader(sheet, s, r, "A3. QUALITY(1–10) — Chất lượng thực thi từng task");
        r = infoRow(sheet, s, r, "Mục đích",
                "Đo mức độ hoàn thành theo 2 tiêu chí khách quan. "
                + "Không dùng giờ ước tính vì Leader nhập thủ công, không phản ánh độ phức tạp thực tế.");
        r = tableHeader(sheet, s, r, "Tiêu chí", "Điều kiện", "Điểm trừ");
        r = tableRow(sheet, s, r,
                "① Đúng hạn (On-time)",
                "Trễ 1–3 ngày / Trễ 4–7 ngày / Trễ > 7 ngày",
                "−1 / −2 / −3");
        r = tableRow(sheet, s, r,
                "② SLA Penalty",
                "Task từng bị hệ thống SLA cắm cờ phạt do quá hạn",
                "−2");
        r = infoRow(sheet, s, r, "Công thức", "Quality = max(1,  10 − Σ điểm trừ)");
        r = infoRow(sheet, s, r, "Phạm vi", "1 (tệ nhất) → 10 (hoàn hảo). Hiển thị N/A nếu task chưa DONE.");
        r++;

        // A4. Task Points
        r = sectionHeader(sheet, s, r, "A4. TASK POINTS — Điểm đóng góp của từng task");
        r = infoRow(sheet, s, r, "Công thức",
                "Task Points = Weight × Priority Factor × (Quality ÷ 10)");
        r = tableHeader(sheet, s, r, "Priority", "Priority Factor", "Giải thích");
        r = tableRow(sheet, s, r, "CRITICAL", "× 1.5", "Task nghiêm trọng, ảnh hưởng toàn hệ thống");
        r = tableRow(sheet, s, r, "HIGH",     "× 1.2", "Task quan trọng, ảnh hưởng luồng chính");
        r = tableRow(sheet, s, r, "MEDIUM",   "× 1.0", "Task thông thường");
        r = tableRow(sheet, s, r, "LOW",      "× 0.8", "Task nhỏ, ít ảnh hưởng");
        r = infoRow(sheet, s, r, "Weight",
                "Hệ số trọng số (mặc định = 1.0, Leader chỉnh khi tạo task).");
        r = infoRow(sheet, s, r, "Lưu ý",
                "Chỉ tính task DONE. Task CANCELLED / IN_PROGRESS / BLOCKED = 0 điểm.");
        r++;

        // ══════════════════════════════════════════════════════════════════════
        // NHÓM B — SHEET 2: MEMBER SUMMARY  (theo thứ tự cột từ trái sang phải)
        // Cột: Completion % | On-time % | Est.(h) | Actual(h) | Avg Quality | Total Points | Contribution %
        // ══════════════════════════════════════════════════════════════════════
        r = sectionTitle(sheet, s, r, "NHÓM B — SHEET 2: MEMBER SUMMARY");
        r++;

        // B1. Completion %
        r = sectionHeader(sheet, s, r, "B1. COMPLETION % — Tỷ lệ hoàn thành");
        r = infoRow(sheet, s, r, "Công thức",
                "Completion % = Số task DONE ÷ Tổng task được giao × 100%");
        r = infoRow(sheet, s, r, "Ý nghĩa",
                "Phản ánh tiến độ hoàn thành công việc của từng thành viên.");
        r++;

        // B2. On-time %
        r = sectionHeader(sheet, s, r, "B2. ON-TIME % — Tỷ lệ hoàn thành đúng hạn");
        r = infoRow(sheet, s, r, "Công thức",
                "On-time % = Số task DONE đúng hạn ÷ Tổng task DONE × 100%");
        r = infoRow(sheet, s, r, "Đúng hạn",
                "completedAt ≤ deadline (so sánh theo ngày, không tính giờ).");
        r++;

        // B3. Est.(h)
        r = sectionHeader(sheet, s, r, "B3. EST.(h) — Tổng giờ ước tính");
        r = infoRow(sheet, s, r, "Nguồn",
                "Tổng estimatedHours của tất cả task được giao cho thành viên (Leader nhập khi tạo task).");
        r = infoRow(sheet, s, r, "Lưu ý",
                "Giá trị mang tính kế hoạch, không dùng để chấm điểm vì không phản ánh độ phức tạp thực tế.");
        r++;

        // B4. Actual(h)
        r = sectionHeader(sheet, s, r, "B4. ACTUAL(h) — Tổng giờ làm việc thực tế");
        r = infoRow(sheet, s, r, "Công thức",
                "Tổng Actual(h) của tất cả task DONE thuộc thành viên (xem công thức A2 ở trên).");
        r++;

        // B5. Avg Quality
        r = sectionHeader(sheet, s, r, "B5. AVG QUALITY — Chất lượng trung bình");
        r = infoRow(sheet, s, r, "Công thức",
                "Avg Quality = Trung bình cộng Quality Score của tất cả task DONE có Quality > 0.");
        r = infoRow(sheet, s, r, "Ý nghĩa",
                "Phản ánh mức độ nhất quán về chất lượng của thành viên, không chỉ tổng điểm.");
        r++;

        // B6. Total Points
        r = sectionHeader(sheet, s, r, "B6. TOTAL POINTS — Tổng điểm đóng góp");
        r = infoRow(sheet, s, r, "Công thức",
                "Total Points = Σ Task Points của tất cả task DONE thuộc thành viên (xem công thức A4).");
        r++;

        // B7. Contribution %
        r = sectionHeader(sheet, s, r, "B7. CONTRIBUTION % — Chỉ số đóng góp tương đối");
        r = infoRow(sheet, s, r, "Mục đích",
                "So sánh đóng góp giữa các thành viên một cách công bằng. Tổng toàn nhóm luôn = 100%.");
        r = infoRow(sheet, s, r, "Công thức",
                "Contribution % = Total Points(thành viên) ÷ Total Points(cả nhóm) × 100%");
        r = infoRow(sheet, s, r, "Ưu điểm",
                "• Làm 3 task khó chất lượng cao > Làm 10 task dễ chất lượng thấp\n"
                + "• Phản ánh cả khối lượng lẫn chất lượng, không chỉ đếm số lượng task.");
        r++;

        // ══════════════════════════════════════════════════════════════════════
        // VÍ DỤ MINH HỌA
        // ══════════════════════════════════════════════════════════════════════
        r = sectionTitle(sheet, s, r, "VÍ DỤ MINH HỌA — QUALITY & TASK POINTS");
        r++;
        r = tableHeader(sheet, s, r, "Scenario", "Tính toán", "Kết quả");
        r = tableRow(sheet, s, r,
                "Task CRITICAL, đúng hạn, không SLA",
                "Quality=10 | Points=1.0×1.5×(10/10)",
                "Quality=10 | Points=1.50");
        r = tableRow(sheet, s, r,
                "Task HIGH, trễ 5 ngày, có SLA penalty",
                "Quality=10−2−2=6 | Points=1.0×1.2×(6/10)",
                "Quality=6 | Points=0.72");
        r = tableRow(sheet, s, r,
                "Task LOW, trễ 2 ngày, không SLA",
                "Quality=10−1=9 | Points=1.0×0.8×(9/10)",
                "Quality=9 | Points=0.72");
        r = tableRow(sheet, s, r,
                "Task MEDIUM, trễ 10 ngày, có SLA penalty",
                "Quality=10−3−2=5 | Points=1.0×1.0×(5/10)",
                "Quality=5 | Points=0.50");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers: display value computation
    // ─────────────────────────────────────────────────────────────────────────

    private record DisplayValues(BigDecimal actualHours, int qualityScore, double taskPoints) {}

    private DisplayValues computeDisplay(Task task) {
        // Actual hours
        BigDecimal actual = task.getActualHours();
        if (actual == null && task.getCompletedAt() != null) {
            LocalDateTime start = task.getStartedAt() != null
                    ? task.getStartedAt()
                    : (task.getStartDate() != null ? task.getStartDate().atStartOfDay() : null);
            if (start != null) {
                long mins = Duration.between(start, task.getCompletedAt()).toMinutes();
                if (mins > 0)
                    actual = BigDecimal.valueOf(mins).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
            }
        }

        // Quality score
        int quality = 0;
        if (task.getStatus() == TaskStatus.DONE) {
            quality = task.getQualityScore() != null
                    ? task.getQualityScore()
                    : TaskServiceImpl.computeQualityScore(task, actual);
        }

        // Task points (only for DONE)
        double points = 0;
        if (task.getStatus() == TaskStatus.DONE && quality > 0) {
            double weight = task.getWeight() != null ? task.getWeight().doubleValue() : 1.0;
            double pf = priorityFactor(task.getPriority());
            points = weight * pf * (quality / 10.0);
        }

        return new DisplayValues(actual, quality, points);
    }

    private double priorityFactor(Priority p) {
        if (p == null) return 1.0;
        return switch (p) {
            case CRITICAL -> 1.5;
            case HIGH     -> 1.2;
            case MEDIUM   -> 1.0;
            case LOW      -> 0.8;
        };
    }

    private Comparator<Task> taskComparator() {
        return Comparator
                .comparingInt((Task t) -> t.getStatus() == TaskStatus.DONE ? 0 : 1)
                .thenComparing(t -> t.getDeadline() != null ? t.getDeadline() : LocalDate.MAX)
                .thenComparingLong(t -> t.getId());
    }

    private String assigneeName(Task t) {
        if (t.getPrimaryAssignee() == null) return "Chưa giao";
        if (t.getPrimaryAssignee().getProfile() != null
                && t.getPrimaryAssignee().getProfile().getFullName() != null)
            return t.getPrimaryAssignee().getProfile().getFullName();
        return t.getPrimaryAssignee().getUsername();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cell helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void cell(Row row, int col, String val, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(val != null ? val : "");
        if (style != null) c.setCellStyle(style);
    }

    private void numCell(Row row, int col, double val, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(val);
        if (style != null) c.setCellStyle(style);
    }

    private void pctCell(Row row, int col, double pct, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(Math.round(pct * 10) / 10.0 + "%");
        if (style != null) c.setCellStyle(style);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Formula sheet row builders
    // ─────────────────────────────────────────────────────────────────────────

    private int sectionTitle(Sheet sheet, Styles s, int r, String text) {
        Row row = sheet.createRow(r);
        row.setHeightInPoints(22);
        cell(row, 1, text, s.formulaTitle);
        sheet.addMergedRegion(new CellRangeAddress(r, r, 1, 3));
        return r + 1;
    }

    private int sectionHeader(Sheet sheet, Styles s, int r, String text) {
        Row row = sheet.createRow(r);
        row.setHeightInPoints(18);
        cell(row, 1, text, s.sectionHeader);
        sheet.addMergedRegion(new CellRangeAddress(r, r, 1, 3));
        return r + 1;
    }

    private int infoRow(Sheet sheet, Styles s, int r, String label, String value) {
        Row row = sheet.createRow(r);
        row.setHeightInPoints(14);
        cell(row, 1, label, s.infoLabel);
        cell(row, 2, value, s.infoValue);
        sheet.addMergedRegion(new CellRangeAddress(r, r, 2, 3));
        return r + 1;
    }

    private int tableHeader(Sheet sheet, Styles s, int r, String c1, String c2, String c3) {
        Row row = sheet.createRow(r);
        cell(row, 1, c1, s.header);
        cell(row, 2, c2, s.header);
        cell(row, 3, c3, s.header);
        return r + 1;
    }

    private int tableRow(Sheet sheet, Styles s, int r, String c1, String c2, String c3) {
        Row row = sheet.createRow(r);
        row.setHeightInPoints(14);
        cell(row, 1, c1, s.data);
        cell(row, 2, c2, s.data);
        cell(row, 3, c3, s.data);
        return r + 1;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Styles inner class
    // ─────────────────────────────────────────────────────────────────────────

    private static class Styles {
        final CellStyle title, header, sprintGroup, memberGroup, data;
        final CellStyle scoreGood, scoreMid, scoreBad;
        final CellStyle formulaTitle, sectionHeader, infoLabel, infoValue;

        Styles(XSSFWorkbook wb) {
            title        = buildTitle(wb);
            header       = buildHeader(wb, IndexedColors.DARK_BLUE);
            sprintGroup  = buildGroup(wb, IndexedColors.LIGHT_CORNFLOWER_BLUE, true);
            memberGroup  = buildGroup(wb, IndexedColors.LIGHT_TURQUOISE, false);
            data         = buildData(wb);
            scoreGood    = buildScore(wb, IndexedColors.BRIGHT_GREEN);
            scoreMid     = buildScore(wb, IndexedColors.GOLD);
            scoreBad     = buildScore(wb, IndexedColors.RED);
            formulaTitle = buildFormulaTitle(wb);
            sectionHeader = buildSectionHeader(wb);
            infoLabel    = buildInfoLabel(wb);
            infoValue    = buildInfoValue(wb);
        }

        private static CellStyle buildTitle(XSSFWorkbook wb) {
            CellStyle s = wb.createCellStyle();
            Font f = wb.createFont();
            f.setBold(true);
            f.setFontHeightInPoints((short) 14);
            s.setFont(f);
            s.setAlignment(HorizontalAlignment.CENTER);
            s.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font ft = wb.createFont();
            ft.setBold(true);
            ft.setFontHeightInPoints((short) 14);
            ft.setColor(IndexedColors.WHITE.getIndex());
            s.setFont(ft);
            return s;
        }

        private static CellStyle buildHeader(XSSFWorkbook wb, IndexedColors bg) {
            CellStyle s = wb.createCellStyle();
            Font f = wb.createFont();
            f.setBold(true);
            f.setColor(IndexedColors.WHITE.getIndex());
            f.setFontHeightInPoints((short) 10);
            s.setFont(f);
            s.setFillForegroundColor(bg.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            s.setAlignment(HorizontalAlignment.CENTER);
            s.setVerticalAlignment(VerticalAlignment.CENTER);
            s.setWrapText(true);
            applyBorder(s);
            return s;
        }

        private static CellStyle buildGroup(XSSFWorkbook wb, IndexedColors bg, boolean bold) {
            CellStyle s = wb.createCellStyle();
            Font f = wb.createFont();
            f.setBold(bold);
            f.setFontHeightInPoints((short) 10);
            s.setFont(f);
            s.setFillForegroundColor(bg.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            s.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorder(s);
            return s;
        }

        private static CellStyle buildData(XSSFWorkbook wb) {
            CellStyle s = wb.createCellStyle();
            s.setWrapText(false);
            s.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorder(s);
            return s;
        }

        private static CellStyle buildScore(XSSFWorkbook wb, IndexedColors bg) {
            CellStyle s = wb.createCellStyle();
            Font f = wb.createFont();
            f.setBold(true);
            s.setFont(f);
            s.setFillForegroundColor(bg.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            s.setAlignment(HorizontalAlignment.CENTER);
            applyBorder(s);
            return s;
        }

        private static CellStyle buildFormulaTitle(XSSFWorkbook wb) {
            CellStyle s = wb.createCellStyle();
            Font f = wb.createFont();
            f.setBold(true);
            f.setFontHeightInPoints((short) 13);
            f.setColor(IndexedColors.DARK_TEAL.getIndex());
            s.setFont(f);
            s.setAlignment(HorizontalAlignment.CENTER);
            return s;
        }

        private static CellStyle buildSectionHeader(XSSFWorkbook wb) {
            CellStyle s = wb.createCellStyle();
            Font f = wb.createFont();
            f.setBold(true);
            f.setFontHeightInPoints((short) 11);
            f.setColor(IndexedColors.WHITE.getIndex());
            s.setFont(f);
            s.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            s.setVerticalAlignment(VerticalAlignment.CENTER);
            return s;
        }

        private static CellStyle buildInfoLabel(XSSFWorkbook wb) {
            CellStyle s = wb.createCellStyle();
            Font f = wb.createFont();
            f.setBold(true);
            f.setFontHeightInPoints((short) 10);
            s.setFont(f);
            s.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            s.setWrapText(true);
            applyBorder(s);
            return s;
        }

        private static CellStyle buildInfoValue(XSSFWorkbook wb) {
            CellStyle s = wb.createCellStyle();
            s.setWrapText(true);
            s.setVerticalAlignment(VerticalAlignment.CENTER);
            applyBorder(s);
            return s;
        }

        private static void applyBorder(CellStyle s) {
            s.setBorderTop(BorderStyle.THIN);
            s.setBorderBottom(BorderStyle.THIN);
            s.setBorderLeft(BorderStyle.THIN);
            s.setBorderRight(BorderStyle.THIN);
        }
    }
}
