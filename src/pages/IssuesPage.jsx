import { useMemo, useState } from "react";
import { ALL_AREAS_CODE } from "../constants/areas";
import IssueCard from "../components/IssueCard";
import { THEME } from "../constants/theme";

const FILTERS = [
  {
    id: "active",
    label: "Active",
  },
  {
    id: "resolved",
    label: "Resolved",
  },
  {
    id: "all",
    label: "All",
  },
];

function IssuesPage({
  activeArea,
  issues,
  onOpenIssue,
}) {
  const [filter, setFilter] = useState("active");

  const visibleIssues = useMemo(() => {
    let filteredIssues = [...issues];

    if (filter === "active") {
      filteredIssues = filteredIssues.filter(
        (issue) => issue.status !== "resolved",
      );
    }

    if (filter === "resolved") {
      filteredIssues = filteredIssues.filter(
        (issue) => issue.status === "resolved",
      );
    }

    // Active urgent issues appear first, followed by the newest records.
    return filteredIssues.sort((first, second) => {
      const firstUrgent =
        first.priority === "Urgent" &&
        first.status !== "resolved";

      const secondUrgent =
        second.priority === "Urgent" &&
        second.status !== "resolved";

      if (firstUrgent !== secondUrgent) {
        return firstUrgent ? -1 : 1;
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });
  }, [filter, issues]);

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
        Issues
      </h1>

      <p
        style={{
          margin: "0 0 16px",
          color: THEME.mute,
          fontSize: 14,
        }}
      >
        {activeArea?.name}
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
        }}
      >
        {FILTERS.map((item) => {
          const isSelected = filter === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setFilter(item.id)}
              style={{
                padding: "8px 14px",
                border: `1.5px solid ${isSelected
                    ? THEME.brass
                    : THEME.line
                  }`,
                borderRadius: 20,
                background: isSelected
                  ? THEME.brassSoft
                  : THEME.card,
                color: isSelected
                  ? THEME.brass
                  : THEME.mute,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {visibleIssues.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            color: THEME.mute,
            textAlign: "center",
          }}
        >
          <div
            style={{
              marginBottom: 10,
              fontSize: 34,
            }}
          >
            🌿
          </div>

          <div
            style={{
              color: THEME.ink,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            All quiet
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            No issues match this filter for{" "}
            {activeArea?.name}.
          </div>
        </div>
      ) : (
        visibleIssues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            showArea={activeArea?.code === ALL_AREAS_CODE}
            onOpen={() => onOpenIssue(issue.id)}
          />
        ))
      )}
    </section>
  );
}

export default IssuesPage;