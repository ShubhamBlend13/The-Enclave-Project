import { useState } from "react";

import Btn from "../components/Btn";
import Field from "../components/Field";
import {
  ALL_AREAS_CODE,
  AREAS,
} from "../constants/areas";
import {
  getUpkeepFrequency,
  UPKEEP_FREQUENCIES,
} from "../constants/upkeep";
import { canManageUpkeep } from "../constants/roles";
import { THEME } from "../constants/theme";
import {
  formatDateTime,
  formatDueDate,
} from "../utils/date";
import { getEnclaveTodayDate } from "../utils/date";
import {
  dateInputToIso,
  toDateInputValue,
} from "../utils/upkeep";

const INPUT_STYLE = {
  width: "100%",
  padding: "13px 14px",
  border: `1.5px solid ${THEME.line}`,
  borderRadius: 12,
  background: THEME.card,
  color: THEME.ink,
  fontSize: 15,
  outline: "none",
};

const minimumDueDate =
  getEnclaveTodayDate();

function UpkeepPage({
  profile,
  activeArea,
  tasks,
  history,
  onSaveTask,
  onCompleteTask,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] =
    useState(null);

  const [completionNotes, setCompletionNotes] =
    useState({});

  const canManage = canManageUpkeep(profile);

  const isAllAreas =
    activeArea?.code === ALL_AREAS_CODE;

  const sortedTasks = [...tasks].sort(
    (first, second) =>
      new Date(first.nextDue).getTime() -
      new Date(second.nextDue).getTime(),
  );

  const openCreateForm = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const openEditForm = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingTask(null);
    setShowForm(false);
  };

  const handleComplete = async (task) => {
    const note =
      completionNotes[task.id]?.trim() ?? "";

    await onCompleteTask(task.id, note);

    setCompletionNotes((currentNotes) => ({
      ...currentNotes,
      [task.id]: "",
    }));
  };

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: "4px 0 4px",
              color: THEME.ink,
              fontFamily: "'Marcellus', serif",
              fontSize: 28,
              fontWeight: 400,
            }}
          >
            Upkeep
          </h1>

          <p
            style={{
              margin: 0,
              color: THEME.mute,
              fontSize: 14,
            }}
          >
            {activeArea?.name}
          </p>
        </div>

        {canManage && !showForm && (
          <Btn
            variant="brass"
            onClick={openCreateForm}
            style={{
              width: "auto",
              padding: "10px 14px",
              fontSize: 13,
            }}
          >
            + Add schedule
          </Btn>
        )}
      </div>

      {canManage && showForm && (
        <UpkeepTaskForm
          activeArea={activeArea}
          task={editingTask}
          onSave={async (formData) => {
            await onSaveTask(formData);
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}

      <div
        style={{
          margin: "22px 0 10px",
          color: THEME.mute,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Scheduled upkeep
      </div>

      {sortedTasks.length === 0 ? (
        <div
          style={{
            padding: "42px 20px",
            border: `1px solid ${THEME.line}`,
            borderRadius: 16,
            background: THEME.card,
            textAlign: "center",
          }}
        >
          <div
            style={{
              marginBottom: 8,
              fontSize: 32,
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
            No upkeep schedules
          </div>

          <div
            style={{
              marginTop: 4,
              color: THEME.mute,
              fontSize: 13,
            }}
          >
            Nothing is scheduled for this area yet.
          </div>
        </div>
      ) : (
        sortedTasks.map((task) => (
          <UpkeepTaskCard
            key={task.id}
            task={task}
            showArea={isAllAreas}
            canManage={canManage}
            completionNote={
              completionNotes[task.id] ?? ""
            }
            onCompletionNoteChange={(value) =>
              setCompletionNotes(
                (currentNotes) => ({
                  ...currentNotes,
                  [task.id]: value,
                }),
              )
            }
            onEdit={() => openEditForm(task)}
            onComplete={() =>
              handleComplete(task)
            }
          />
        ))
      )}

      <UpkeepHistory
        history={history}
        showArea={isAllAreas}
      />
    </section>
  );
}

function UpkeepTaskForm({
  activeArea,
  task,
  onSave,
  onCancel,
}) {
  const isEditing = Boolean(task);

  const initialAreaCode = isEditing
    ? task.areaCode
    : activeArea?.code === ALL_AREAS_CODE
      ? ""
      : activeArea?.code ?? "";

  const [areaCode, setAreaCode] =
    useState(initialAreaCode);

  const [title, setTitle] = useState(
    task?.title ?? "",
  );

  const [icon, setIcon] = useState(
    task?.icon ?? "🛠️",
  );

  const [frequency, setFrequency] = useState(
    task?.frequency ?? "monthly",
  );

  const [nextDue, setNextDue] = useState(
    toDateInputValue(task?.nextDue),
  );

  const [saving, setSaving] = useState(false);

  const canSubmit =
    Boolean(areaCode) &&
    Boolean(title.trim()) &&
    Boolean(nextDue) &&
    !saving;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const nextDueIso = dateInputToIso(nextDue);

    if (!nextDueIso) {
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: task?.id ?? null,
        areaCode,
        title: title.trim(),
        icon: icon.trim() || "🛠️",
        frequency,
        nextDue: nextDueIso,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 20,
        padding: 16,
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
      }}
    >
      <div
        style={{
          marginBottom: 14,
          color: THEME.ink,
          fontFamily: "'Marcellus', serif",
          fontSize: 18,
        }}
      >
        {isEditing
          ? "Edit upkeep schedule"
          : "Add upkeep schedule"}
      </div>

      <Field label="Area">
        <select
          value={areaCode}
          onChange={(event) =>
            setAreaCode(event.target.value)
          }
          style={INPUT_STYLE}
        >
          <option value="">Select an area</option>

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

      <Field label="Task">
        <input
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="e.g. AC deep service"
          style={INPUT_STYLE}
        />
      </Field>

      <Field label="Icon">
        <input
          type="text"
          value={icon}
          onChange={(event) =>
            setIcon(event.target.value)
          }
          placeholder="🛠️"
          maxLength={4}
          style={INPUT_STYLE}
        />
      </Field>

      <Field label="Frequency">
        <select
          value={frequency}
          onChange={(event) =>
            setFrequency(event.target.value)
          }
          style={INPUT_STYLE}
        >
          {UPKEEP_FREQUENCIES.map(
            (frequencyOption) => (
              <option
                key={frequencyOption.id}
                value={frequencyOption.id}
              >
                {frequencyOption.label}
              </option>
            ),
          )}
        </select>
      </Field>

      <Field label="Next due">
        <input
          type="date"
          value={nextDue}
          min={minimumDueDate}
          onChange={(event) =>
            setNextDue(event.target.value)
          }
          style={INPUT_STYLE}
        />
      </Field>

      <div
        style={{
          display: "flex",
          gap: 10,
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
          {saving
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create schedule"}
        </Btn>
      </div>
    </form>
  );
}

function UpkeepTaskCard({
  task,
  showArea,
  canManage,
  completionNote,
  onCompletionNoteChange,
  onEdit,
  onComplete,
}) {
  const frequency =
    getUpkeepFrequency(task.frequency);

  const areaLabel =
    task.areaCode === "CLUBHOUSE"
      ? "Clubhouse"
      : `Villa ${task.areaCode}`;

  return (
    <article
      style={{
        marginBottom: 12,
        padding: 16,
        border: `1px solid ${THEME.line}`,
        borderRadius: 16,
        background: THEME.card,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 11,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 42,
              height: 42,
              flexShrink: 0,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: THEME.greenSoft,
              fontSize: 21,
            }}
          >
            {task.icon}
          </div>

          <div>
            <div
              style={{
                color: THEME.ink,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {task.title}
            </div>

            <div
              style={{
                marginTop: 3,
                color: THEME.mute,
                fontSize: 12.5,
              }}
            >
              {showArea && (
                <>
                  {areaLabel}
                  {" · "}
                </>
              )}

              {frequency?.label ??
                task.frequency}
            </div>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={onEdit}
            style={{
              padding: "5px 8px",
              border: "none",
              background: "transparent",
              color: THEME.green,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${THEME.line}`,
        }}
      >
        <div>
          <div
            style={{
              color: THEME.mute,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Next due
          </div>

          <div
            style={{
              marginTop: 3,
              color: THEME.ink,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {formatDueDate(task.nextDue)}
          </div>
        </div>

        {task.lastCompletedAt && (
          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                color: THEME.mute,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Last completed
            </div>

            <div
              style={{
                marginTop: 3,
                color: THEME.ok,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {formatDueDate(
                task.lastCompletedAt,
              )}
            </div>
          </div>
        )}
      </div>

      {canManage && (
        <div
          style={{
            marginTop: 14,
          }}
        >
          <input
            type="text"
            value={completionNote}
            onChange={(event) =>
              onCompletionNoteChange(
                event.target.value,
              )
            }
            placeholder="Completion note, optional"
            style={{
              ...INPUT_STYLE,
              marginBottom: 8,
              fontSize: 13,
            }}
          />

          <Btn
            variant="quiet"
            onClick={onComplete}
          >
            Mark complete
          </Btn>
        </div>
      )}
    </article>
  );
}

function UpkeepHistory({
  history,
  showArea,
}) {
  return (
    <>
      <div
        style={{
          margin: "26px 0 10px",
          color: THEME.mute,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Recent completion history
      </div>

      {history.length === 0 ? (
        <div
          style={{
            padding: 18,
            border: `1px solid ${THEME.line}`,
            borderRadius: 14,
            background: THEME.card,
            color: THEME.mute,
            fontSize: 13.5,
          }}
        >
          No upkeep tasks have been completed yet.
        </div>
      ) : (
        history.map((entry) => {
          const areaLabel =
            entry.areaCode === "CLUBHOUSE"
              ? "Clubhouse"
              : `Villa ${entry.areaCode}`;

          return (
            <div
              key={entry.id}
              style={{
                marginBottom: 8,
                padding: "12px 14px",
                border: `1px solid ${THEME.line}`,
                borderRadius: 14,
                background: THEME.card,
              }}
            >
              <div
                style={{
                  color: THEME.ink,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ✓ {entry.taskTitle}
              </div>

              <div
                style={{
                  marginTop: 3,
                  color: THEME.mute,
                  fontSize: 12,
                }}
              >
                {showArea && (
                  <>
                    {areaLabel}
                    {" · "}
                  </>
                )}

                {entry.completedBy}
                {" · "}
                {formatDateTime(
                  entry.completedAt,
                )}
              </div>

              {entry.note && (
                <div
                  style={{
                    marginTop: 5,
                    color: "#42504A",
                    fontSize: 13,
                  }}
                >
                  {entry.note}
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}

export default UpkeepPage;