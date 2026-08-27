import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useDailyLog } from '../hooks/useDailyLog.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { SearchSelect } from '../components/SearchSelect.jsx';
import { StatusPanel } from '../components/StatusPanel.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { Icon } from '../components/Icon.jsx';
import { minAllowedDateString, shiftDateString, todayString, formatDateDisplay } from '../utils/dateWindow.js';
import { calculateActivityCalories, calculateFoodCalories } from '../services/calc.js';
import { titleCase } from '../utils/text.js';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export function UserTrackerPage({ userId, onBack, onHeaderChange }) {
  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState('loading');
  const [date, setDate] = useState(todayString());
  // Unsaved additions/removals live only in TrackerBody's state until Save
  // Day is pressed; both track it here too so date changes and "Back to
  // Users" can be intercepted with a confirmation instead of silently
  // discarding them.
  const [dirty, setDirty] = useState(false);
  const [pendingNav, setPendingNav] = useState(null); // null | { type: 'date', value } | { type: 'back' }

  useEffect(() => {
    api
      .getUser(userId)
      .then((data) => {
        setUser(data);
        setUserStatus('ready');
      })
      .catch(() => setUserStatus('error'));
  }, [userId]);

  // Warn on a hard refresh/tab close too — the in-browser equivalent of the
  // date-change/back-navigation guard below, since neither of those apply.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  const goToDate = useCallback(
    (next) => {
      if (dirty) {
        setPendingNav({ type: 'date', value: next });
      } else {
        setDate(next);
      }
    },
    [dirty],
  );

  const requestBack = useCallback(() => {
    if (dirty) {
      setPendingNav({ type: 'back' });
    } else {
      onBack();
    }
  }, [dirty, onBack]);

  const confirmDiscardAndNavigate = useCallback(() => {
    if (pendingNav?.type === 'date') setDate(pendingNav.value);
    else if (pendingNav?.type === 'back') onBack();
    setDirty(false);
    setPendingNav(null);
  }, [pendingNav, onBack]);

  const leading = useMemo(
    () => (
      <button type="button" className="btn btn-secondary btn-nav-back" onClick={requestBack}>
        <Icon name="back" size={16} /> Users
      </button>
    ),
    [requestBack],
  );

  const title = useMemo(
    () => (
      <>
        <span className="app-header__mark">NET//CAL</span>
        <span className="app-header__tagline">{user ? user.name : 'Loading…'}</span>
      </>
    ),
    [user],
  );

  useEffect(() => {
    onHeaderChange?.({ leading, title });
    return () => onHeaderChange?.(null);
  }, [leading, title, onHeaderChange]);

  const minDate = minAllowedDateString();
  const maxDate = todayString();

  return (
    <div className="tracker-page">
      {userStatus === 'loading' && <StatusPanel kind="loading" message="Loading user…" />}
      {userStatus === 'error' && <StatusPanel kind="error" message="Could not load this user." />}

      {userStatus === 'ready' && user && (
        <>
          <header className="tracker-header glass-panel">
            <div>
              {/* Uppercased in CSS, not JS: screen readers spell out
                  all-caps short names, and the accessible name should match
                  what was actually stored. */}
              <h1 className="tracker-header__name">{user.name}</h1>
              <p className="tracker-header__meta mono">
                {user.weightKg} kg · {user.heightCm} cm · {user.sex === 'male' ? 'Male' : 'Female'}
              </p>
            </div>
            <div className="date-nav">
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => date > minDate && goToDate(shiftDateString(date, -1))}
                disabled={date <= minDate}
                aria-label="Previous day"
              >
                <Icon name="chevron-left" size={16} />
              </button>
              <label className="visually-hidden" htmlFor="date-picker">
                Selected date
              </label>
              <input
                id="date-picker"
                className="input mono"
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                // Ignoring empty values entirely made the field fight the
                // user when they cleared it; instead keep the last valid date
                // and only commit real ones.
                onChange={(e) => {
                  const next = e.target.value;
                  if (next && next >= minDate && next <= maxDate) goToDate(next);
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-icon"
                onClick={() => date < maxDate && goToDate(shiftDateString(date, 1))}
                disabled={date >= maxDate}
                aria-label="Next day"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </header>

          <TrackerBody key={date} user={user} date={date} onDirtyChange={setDirty} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingNav)}
        title="Unsaved changes"
        description="You have food or activity entries for this day that haven't been saved. Leaving now will discard them."
        confirmLabel="Discard changes"
        onConfirm={confirmDiscardAndNavigate}
        onCancel={() => setPendingNav(null)}
      />
    </div>
  );
}

function TrackerBody({ user, date, onDirtyChange }) {
  const {
    status,
    error,
    foodEntries,
    activityEntries,
    addFoodEntry,
    removeFoodEntry,
    addActivityEntry,
    removeActivityEntry,
    bmr,
    foodCalories,
    activityCalories,
    netCalories,
    saving,
    saveError,
    lastSavedAt,
    dirty,
    save,
  } = useDailyLog(user._id, date, user);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const isToday = date === todayString();

  const [selectedFood, setSelectedFood] = useState(null);
  const [meal, setMeal] = useState('breakfast');
  const [quantityGrams, setQuantityGrams] = useState('');

  const [selectedActivity, setSelectedActivity] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState('');

  const searchFoods = useCallback((query) => api.searchFoods({ search: query, limit: 8 }), []);
  const searchActivities = useCallback((query) => api.searchActivities({ search: query, limit: 8 }), []);

  const foodPreviewCalories =
    selectedFood && Number(quantityGrams) > 0
      ? calculateFoodCalories({ caloriesPer100g: selectedFood.caloriesPer100g, quantityGrams: Number(quantityGrams) })
      : null;

  const activityPreviewCalories =
    selectedActivity && Number(durationMinutes) > 0
      ? calculateActivityCalories({
          metValue: selectedActivity.metValue,
          weightKg: user.weightKg,
          durationMinutes: Number(durationMinutes),
        })
      : null;

  function handleAddFood(e) {
    e.preventDefault();
    if (!selectedFood || !(Number(quantityGrams) > 0)) return;
    addFoodEntry(selectedFood, meal, Number(quantityGrams));
    setSelectedFood(null);
    setQuantityGrams('');
  }

  function handleAddActivity(e) {
    e.preventDefault();
    if (!selectedActivity || !(Number(durationMinutes) > 0)) return;
    addActivityEntry(selectedActivity, Number(durationMinutes));
    setSelectedActivity(null);
    setDurationMinutes('');
  }

  if (status === 'loading') return <StatusPanel kind="loading" message="Loading day…" />;
  if (status === 'error') return <StatusPanel kind="error" message={error ?? 'Could not load this day.'} />;

  const netTone = netCalories <= 0 ? 'positive' : 'negative';
  const netQualifier = netCalories <= 0 ? 'Deficit' : 'Surplus';

  return (
    <div className="tracker-body">
      <div className="metric-grid">
        <MetricCard label="Calories In" value={foodCalories} />
        <MetricCard label="BMR" value={bmr} />
        <MetricCard label="Activity Out" value={activityCalories} />
        <MetricCard
          label="Net Calories"
          value={netCalories}
          tone={netTone}
          hint={`${netQualifier} · Food − BMR − Activity`}
        />
      </div>

      <div className="entry-columns">
        <section className="glass-panel entry-panel" aria-labelledby="food-heading">
          <h2 id="food-heading">Calories In</h2>
          <h3 className="eyebrow">Add Food</h3>
          <form className="entry-form" onSubmit={handleAddFood}>
            <SearchSelect
              label="Food"
              placeholder="Search foods…"
              searchFn={searchFoods}
              onSelect={setSelectedFood}
              onQueryChange={() => setSelectedFood(null)}
              getOptionLabel={(f) => f.name}
              renderOption={(f) => (
                <div>
                  <div>{f.name}</div>
                  <div className="search-select__sub mono">
                    {f.caloriesPer100g} kcal / 100g{f.servingDescription ? ` · ${f.servingDescription}` : ''}
                  </div>
                </div>
              )}
            />
            {selectedFood && (
              <p className="selection-note mono">
                Selected: {selectedFood.name} — Serving reference:{' '}
                {selectedFood.servingDescription ?? 'n/a'} · {selectedFood.caloriesPer100g} kcal / 100g
              </p>
            )}
            <div className="field">
              <label htmlFor="meal">Meal</label>
              <select id="meal" className="input" value={meal} onChange={(e) => setMeal(e.target.value)}>
                {MEAL_ORDER.map((m) => (
                  <option key={m} value={m}>
                    {MEAL_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="quantityGrams">Quantity (g)</label>
              <input
                id="quantityGrams"
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={quantityGrams}
                onChange={(e) => setQuantityGrams(e.target.value)}
              />
            </div>
            {foodPreviewCalories !== null && (
              <p className="preview mono">
                {quantityGrams} g <Icon name="chevron-right" size={14} /> {foodPreviewCalories} kcal
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={!selectedFood || !(Number(quantityGrams) > 0)}>
              Add Food
            </button>
          </form>

          <hr className="entry-divider" />
          <h3 className="eyebrow">{isToday ? "Today's Food" : `Food — ${formatDateDisplay(date)}`}</h3>
          <FoodEntriesList entries={foodEntries} onRemove={removeFoodEntry} />
          <div className="daily-total">
            <span className="eyebrow">Daily Total</span>
            <span className="daily-total__value mono">{foodCalories} kcal</span>
          </div>
        </section>

        <section className="glass-panel entry-panel" aria-labelledby="activity-heading">
          <h2 id="activity-heading">Calories Out</h2>
          <h3 className="eyebrow">Add Activity</h3>
          <form className="entry-form" onSubmit={handleAddActivity}>
            <SearchSelect
              label="Activity"
              placeholder="Search activities…"
              searchFn={searchActivities}
              onSelect={setSelectedActivity}
              onQueryChange={() => setSelectedActivity(null)}
              getOptionLabel={(a) => `${titleCase(a.activityName)} · ${a.specificMotion} · ${a.metValue} MET`}
              renderOption={(a) => (
                <div>
                  <div>{titleCase(a.activityName)}</div>
                  <div className="search-select__sub mono">
                    {a.specificMotion} · {a.metValue} MET
                  </div>
                </div>
              )}
            />
            {selectedActivity && (
              <p className="selection-note mono">
                Selected: {titleCase(selectedActivity.activityName)} · {selectedActivity.specificMotion} ·{' '}
                {selectedActivity.metValue} MET
              </p>
            )}
            <div className="field">
              <label htmlFor="durationMinutes">Duration (min)</label>
              <input
                id="durationMinutes"
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            {activityPreviewCalories !== null && (
              <p className="preview mono">
                Duration: {durationMinutes} min · MET: {selectedActivity.metValue} · Estimated burn:{' '}
                {activityPreviewCalories} kcal
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!selectedActivity || !(Number(durationMinutes) > 0)}
            >
              Add Activity
            </button>
          </form>

          <hr className="entry-divider" />
          <h3 className="eyebrow">{isToday ? "Today's Activities" : `Activities — ${formatDateDisplay(date)}`}</h3>
          <ActivityEntriesList entries={activityEntries} onRemove={removeActivityEntry} />
          <div className="daily-total">
            <span className="eyebrow">Daily Total</span>
            <span className="daily-total__value mono">{activityCalories} kcal</span>
          </div>
        </section>
      </div>

      <div className="save-bar glass-panel">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Day'}
        </button>
        {saveError && (
          <span className="field-error" role="alert">
            {saveError}
          </span>
        )}
        {/* Priority: a failed save always wins; otherwise an edit made since
            the last save should say so rather than still claiming "Saved"
            for a day that no longer matches the server. */}
        {!saveError && dirty && !saving && (
          <span className="save-bar__status save-bar__status--unsaved mono" role="status" aria-live="polite">
            Unsaved changes
          </span>
        )}
        {!saveError && !dirty && lastSavedAt && (
          <span className="save-bar__status mono" role="status" aria-live="polite">
            <Icon name="save" size={14} /> Saved for {formatDateDisplay(date)}
          </span>
        )}
      </div>
    </div>
  );
}

function FoodEntriesList({ entries, onRemove }) {
  if (entries.length === 0) {
    return <StatusPanel kind="empty" message="No food logged yet." />;
  }

  return (
    <div className="entries-list">
      {MEAL_ORDER.filter((meal) => entries.some((e) => e.meal === meal)).map((meal) => (
        <div key={meal} className="entries-group">
          <h3 className="eyebrow">{MEAL_LABELS[meal]}</h3>
          <ul>
            {entries
              .filter((entry) => entry.meal === meal)
              .map((entry) => (
                <li key={entry.localId} className="entry-row">
                  <span className="entry-row__content">
                    {entry.foodName}{' '}
                    <span className="mono entry-row__meta">
                      {entry.quantityGrams}g · {entry.calories} kcal
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => onRemove(entry.localId)}
                    aria-label={`Remove ${entry.foodName}`}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ActivityEntriesList({ entries, onRemove }) {
  if (entries.length === 0) {
    return <StatusPanel kind="empty" message="No activity logged yet." />;
  }

  return (
    <ul className="entries-list">
      {entries.map((entry) => (
        <li key={entry.localId} className="entry-row">
          <span className="entry-row__content">
            {titleCase(entry.activityName)} · {entry.specificMotion} · {entry.metValue} MET{' '}
            <span className="mono entry-row__meta">
              {entry.durationMinutes} min · {entry.caloriesBurned} kcal
            </span>
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={() => onRemove(entry.localId)}
            aria-label={`Remove ${entry.activityName}`}
          >
            <Icon name="close" size={14} />
          </button>
        </li>
      ))}
    </ul>
  );
}
