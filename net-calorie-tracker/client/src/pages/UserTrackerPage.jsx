import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useDailyLog } from '../hooks/useDailyLog.js';
import { MetricCard } from '../components/MetricCard.jsx';
import { SearchSelect } from '../components/SearchSelect.jsx';
import { StatusPanel } from '../components/StatusPanel.jsx';
import { minAllowedDateString, shiftDateString, todayString, formatDateDisplay } from '../utils/dateWindow.js';
import { calculateActivityCalories, calculateFoodCalories } from '../services/calc.js';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

export function UserTrackerPage({ userId, onBack }) {
  const [user, setUser] = useState(null);
  const [userStatus, setUserStatus] = useState('loading');
  const [date, setDate] = useState(todayString());

  useEffect(() => {
    setUserStatus('loading');
    api
      .getUser(userId)
      .then((data) => {
        setUser(data);
        setUserStatus('ready');
      })
      .catch(() => setUserStatus('error'));
  }, [userId]);

  const minDate = minAllowedDateString();
  const maxDate = todayString();

  return (
    <div className="tracker-page">
      <button type="button" className="btn btn-secondary back-link" onClick={onBack}>
        ← Back to Users
      </button>

      {userStatus === 'loading' && <StatusPanel kind="loading" message="Loading user…" />}
      {userStatus === 'error' && <StatusPanel kind="error" message="Could not load this user." />}

      {userStatus === 'ready' && user && (
        <>
          <header className="tracker-header glass-panel">
            <div>
              <h1 className="tracker-header__name">{user.name.toUpperCase()}</h1>
              <p className="tracker-header__meta mono">
                {user.weightKg} kg · {user.heightCm} cm · {user.sex === 'male' ? 'Male' : 'Female'}
              </p>
            </div>
            <div className="date-nav">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDate((d) => (d > minDate ? shiftDateString(d, -1) : d))}
                disabled={date <= minDate}
                aria-label="Previous day"
              >
                ‹
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
                onChange={(e) => e.target.value && setDate(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDate((d) => (d < maxDate ? shiftDateString(d, 1) : d))}
                disabled={date >= maxDate}
                aria-label="Next day"
              >
                ›
              </button>
            </div>
          </header>

          <TrackerBody key={date} user={user} date={date} />
        </>
      )}
    </div>
  );
}

function TrackerBody({ user, date }) {
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
    save,
  } = useDailyLog(user._id, date, user);

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
          <form className="entry-form" onSubmit={handleAddFood}>
            <SearchSelect
              label="Food"
              placeholder="Search foods…"
              searchFn={searchFoods}
              onSelect={setSelectedFood}
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
                {quantityGrams} g → {foodPreviewCalories} kcal
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={!selectedFood || !(Number(quantityGrams) > 0)}>
              Add Food
            </button>
          </form>

          <FoodEntriesList entries={foodEntries} onRemove={removeFoodEntry} />
        </section>

        <section className="glass-panel entry-panel" aria-labelledby="activity-heading">
          <h2 id="activity-heading">Calories Out</h2>
          <form className="entry-form" onSubmit={handleAddActivity}>
            <SearchSelect
              label="Activity"
              placeholder="Search activities…"
              searchFn={searchActivities}
              onSelect={setSelectedActivity}
              getOptionLabel={(a) => `${a.activityName} — ${a.specificMotion}`}
              renderOption={(a) => (
                <div>
                  <div>
                    {a.activityName} — {a.specificMotion}
                  </div>
                  <div className="search-select__sub mono">MET {a.metValue}</div>
                </div>
              )}
            />
            {selectedActivity && (
              <p className="selection-note mono">
                Selected: {selectedActivity.activityName} — {selectedActivity.specificMotion} (MET{' '}
                {selectedActivity.metValue})
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

          <ActivityEntriesList entries={activityEntries} onRemove={removeActivityEntry} />
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
        {!saveError && lastSavedAt && (
          <span className="save-bar__status mono">Saved for {formatDateDisplay(date)}</span>
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
          <h3 className="entries-group__title">{MEAL_LABELS[meal]}</h3>
          <ul>
            {entries
              .filter((entry) => entry.meal === meal)
              .map((entry) => (
                <li key={entry.localId} className="entry-row">
                  <span>
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
                    ✕
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
          <span>
            {entry.activityName} — {entry.specificMotion}{' '}
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
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
