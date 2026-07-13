import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportContext } from "@/lib/reports/loadReport";
import type { ReportField } from "@/lib/reports";

function displayValue(field: ReportField, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (field.type === "score") return `${value} / ${field.max ?? 100}`;
  if (field.type === "grade") {
    const opt = field.options?.find((o) => o.value === String(value));
    return opt ? opt.label : String(value);
  }
  return String(value);
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
  section: { marginBottom: 10 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1pt solid #f3f4f6",
    paddingBottom: 2,
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1f2937" },
  sectionPercent: { fontSize: 10, color: "#6b7280" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1pt solid #f9fafb",
    paddingVertical: 2,
  },
  rowLabel: { color: "#4b5563" },
  rowValue: { fontFamily: "Helvetica-Bold", color: "#1f2937" },
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
  const { report, student, term, teacher, subject, template, result, data } =
    ctx;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Jameah · Islamic Institute</Text>
          <Text style={styles.subtitle}>
            {subject?.name ?? template.label} — {term?.name}{" "}
            {term?.academicYear}
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>STUDENT</Text>
            <Text style={styles.infoValue}>{student?.name}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>CODE</Text>
            <Text style={styles.infoValue}>{student?.studentCode}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>GRADE</Text>
            <Text style={styles.infoValue}>{student?.grade || "—"}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>TEACHER</Text>
            <Text style={styles.infoValue}>{teacher?.name}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>STATUS</Text>
            <Text style={styles.infoValue}>{report.status}</Text>
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

        {template.sections.map((section) => {
          const sectionResult = result.sections.find((s) => s.id === section.id);
          const visibleFields = section.fields.filter(
            (f) => f.type !== "text" || (data[f.id] && String(data[f.id]).trim()),
          );
          return (
            <View key={section.id} style={styles.section} wrap={false}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {sectionResult?.percent !== null ? (
                  <Text style={styles.sectionPercent}>{sectionResult?.percent}%</Text>
                ) : (
                  <Text />
                )}
              </View>
              {visibleFields.map((field) => (
                <View key={field.id} style={styles.row}>
                  <Text style={styles.rowLabel}>{field.label}</Text>
                  <Text style={styles.rowValue}>
                    {displayValue(field, data[field.id])}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        <Text style={styles.footer} fixed>
          Generated by Jameah Islamic Institute · {new Date().toLocaleDateString()}
        </Text>
      </Page>
    </Document>
  );
}
