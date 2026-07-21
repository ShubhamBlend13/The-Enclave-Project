import { useState } from "react";

import Btn from "../components/Btn";
import Field from "../components/Field";
import {
  ALL_AREAS_CODE,
  AREAS,
} from "../constants/areas";
import {
  ISSUE_CATEGORIES,
  ISSUE_PRIORITIES,
} from "../constants/issues";
import {
  isOwnerAdmin,
  isUpkeepManager,
} from "../constants/roles";
import { THEME } from "../constants/theme";

const INPUT_STYLE = {
  width: "100%",
  padding: "13px 14px",
  border: `1.5px solid ${THEME.line}`,
  borderRadius: 12,
  background: THEME.card,
  color: THEME.ink,
  fontSize: 16,
  outline: "none",
};

function ReportIssuePage({
  profile,
  activeArea,
  onSubmit,
  onCancel,
}) {
  // Operational users can report an issue in any real property area.
  const canChooseArea =
    isOwnerAdmin(profile) ||
    isUpkeepManager(profile);

  // ALL is only a viewing context, so it never becomes a report area.
  const initialAreaCode =
    activeArea?.code &&
    activeArea.code !== ALL_AREAS_CODE
      ? activeArea.code
      : "";

  const [reportAreaCode, setReportAreaCode] =
    useState(initialAreaCode);

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [submitting, setSubmitting] = useState(false);

  const reportArea = AREAS.find(
    (area) => area.code === reportAreaCode,
  );

  const canSubmit =
    Boolean(reportAreaCode) &&
    Boolean(category) &&
    Boolean(description.trim()) &&
    !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      // The selected real area travels with the form data.
      // App-level state can change later without changing this report.
      await onSubmit({
        areaCode: reportAreaCode,
        category,
        location: location.trim(),
        description: description.trim(),
        priority,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h1
        style={{
          margin: "4px 0 4px",
          color: THEME.ink,
          fontFamily: "'Marcellus', serif",
          fontSize: 28,
          fontWeight: 400,
        }}
      >
        Report an issue
      </h1>

      <p
        style={{
          margin: "0 0 18px",
          color: THEME.mute,
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        Staff will see the issue after it is
        submitted.
      </p>

      {canChooseArea ? (
        <Field label="Report issue for">
          <select
            value={reportAreaCode}
            onChange={(event) =>
              setReportAreaCode(event.target.value)
            }
            style={INPUT_STYLE}
          >
            <option value="">
              Select an area
            </option>

            {AREAS.map((area) => (
              <option
                key={area.code}
                value={area.code}
              >
                {area.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <div
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            border: `1px solid ${THEME.line}`,
            borderRadius: 12,
            background: THEME.greenSoft,
          }}
        >
          <div
            style={{
              color: THEME.mute,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Reporting for
          </div>

          <div
            style={{
              marginTop: 3,
              color: THEME.green,
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {reportArea?.name}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Field label="What kind of issue?">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {ISSUE_CATEGORIES.map((item) => {
              const isSelected = category === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setCategory(item.id)}
                  style={{
                    padding: "12px 6px",
                    border: `1.5px solid ${
                      isSelected
                        ? THEME.green
                        : THEME.line
                    }`,
                    borderRadius: 12,
                    background: isSelected
                      ? THEME.greenSoft
                      : THEME.card,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      marginBottom: 4,
                      fontSize: 20,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div
                    style={{
                      color: isSelected
                        ? THEME.green
                        : THEME.mute,
                      fontSize: 11,
                      fontWeight: 600,
                      lineHeight: 1.25,
                    }}
                  >
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Where exactly?">
          <input
            type="text"
            value={location}
            onChange={(event) =>
              setLocation(event.target.value)
            }
            placeholder={
              reportAreaCode === "CLUBHOUSE"
                ? "e.g. Swimming pool, gym, entrance"
                : "e.g. Master bedroom, terrace, kitchen"
            }
            style={INPUT_STYLE}
          />
        </Field>

        <Field label="Describe the issue">
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="What is happening? Since when? Add any useful details."
            rows={5}
            style={{
              ...INPUT_STYLE,
              minHeight: 110,
              resize: "vertical",
            }}
          />
        </Field>

        <Field label="Priority">
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            {ISSUE_PRIORITIES.map((item) => {
              const isSelected = priority === item;
              const isUrgent = item === "Urgent";

              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setPriority(item)}
                  style={{
                    flex: 1,
                    padding: "11px 0",
                    border: `1.5px solid ${
                      isSelected
                        ? isUrgent
                          ? THEME.red
                          : THEME.green
                        : THEME.line
                    }`,
                    borderRadius: 12,
                    background: isSelected
                      ? isUrgent
                        ? "#F7E6E0"
                        : THEME.greenSoft
                      : THEME.card,
                    color: isSelected
                      ? isUrgent
                        ? THEME.red
                        : THEME.green
                      : THEME.mute,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </Field>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 8,
          }}
        >
          <Btn
            variant="ghost"
            onClick={onCancel}
            style={{
              flex: 1,
            }}
          >
            Cancel
          </Btn>

          <Btn
            type="submit"
            disabled={!canSubmit}
            style={{
              flex: 2,
            }}
          >
            {submitting
              ? "Submitting..."
              : "Submit issue"}
          </Btn>
        </div>
      </form>
    </section>
  );
}

export default ReportIssuePage;