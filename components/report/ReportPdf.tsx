import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportContext } from "@/lib/reports/loadReport";
import { markFieldId, remarksFieldId } from "@/lib/reports";

function markDisplay(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  return `${value} / 100`;
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#111827", fontFamily: "Helvetica" },
  header: { borderBottom: "1pt solid #d1d5db", paddingBottom: 8, marginBottom: 12 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#065f46" },
  subtitle: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  infoCell: { width: "33%", marginBottom: 6 },
  infoLabel: { fontSize: 8, color: "#9ca3af" },
  infoValue: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  summary: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  summaryCell: { width: "50%", alignItems: "center" },
  summaryLabel: { fontSize: 8, color: "#047857" },
  summaryValue: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#064e3b" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  subjectRow: { marginBottom: 4 },
  subjectHead: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  subjectName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1f2937" },
  subjectMark: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1f2937" },
  remarkText: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  empty: { fontSize: 9, color: "#9ca3af", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTop: "1pt solid #e5e7eb",
    paddingTop: 4,
    fontSize: 8,
    color: "#9ca3af",
  },
});

export default function ReportPdf({ ctx }: { ctx: ReportContext }) {
  const { student, term, template, result, data, subjects } = ctx;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Jameah Mahmoodiyah Progress Report</Text>
          <Text style={styles.subtitle}>
            {template.label} — {term?.name} {term?.academicYear}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>STUDENT</Text>
            <Text style={styles.infoValue}>{student?.name}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>GRADE</Text>
            <Text style={styles.infoValue}>{student?.grade || "—"}</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>OVERALL</Text>
            <Text style={styles.summaryValue}>
              {result.percent === null ? "—" : `${result.percent}%`}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>GRADE</Text>
            <Text style={styles.summaryValue}>{result.grade}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Subjects</Text>
        {subjects.length === 0 ? (
          <Text style={styles.empty}>No subjects assigned to this student.</Text>
        ) : (
          subjects.map((s) => {
            const mark = data[markFieldId(s.id)];
            const remark = data[remarksFieldId(s.id)];
            return (
              <View key={s.id} style={styles.subjectRow} wrap={false}>
                <View style={styles.subjectHead}>
                  <Text style={styles.subjectName}>
                    {s.teacher ? `${s.name} — ${s.teacher}` : s.name}
                  </Text>
                  <Text style={styles.subjectMark}>{markDisplay(mark)}</Text>
                </View>
                {remark ? (
                  <Text style={styles.remarkText}>{String(remark)}</Text>
                ) : null}
              </View>
            );
          })
        )}

        <Text style={styles.footer} fixed>
          Generated on {new Date().toLocaleDateString()} · Jameah Islamic Institute
        </Text>
      </Page>
    </Document>
  );
}
