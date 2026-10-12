import { useEffect, useState } from "react";
import "./WeatherWidget.css";

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=54.6872&longitude=25.2797&current=temperature_2m&timezone=Europe%2FVilnius";
const REFRESH_INTERVAL = 15 * 60 * 1000;

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let disposed = false;
    let controller = null;
    let pending = false;

    async function loadWeather() {
      if (pending) return;
      pending = true;
      controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const response = await fetch(WEATHER_URL, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Weather API error");
        const data = await response.json();
        if (!Number.isFinite(data.current?.temperature_2m)) {
          throw new Error("Invalid temperature");
        }
        if (!disposed) {
          setWeather({
            temperature: data.current.temperature_2m,
            updatedAt: new Date(),
          });
          setError(false);
        }
      } catch {
        if (!disposed) setError(true);
      } finally {
        clearTimeout(timeoutId);
        pending = false;
      }
    }

    void loadWeather();
    const intervalId = setInterval(loadWeather, REFRESH_INTERVAL);

    return () => {
      disposed = true;
      clearInterval(intervalId);
      controller?.abort();
    };
  }, []);

  return (
    <section className="weather-widget" aria-label="Orai Vilniuje">
      <header className="weather-widget__header">
        <div>
          <p className="weather-widget__label">Dabartiniai orai</p>
          <h2>Miestas: Vilnius</h2>
        </div>
        <span className="weather-widget__icon" aria-hidden="true">☀</span>
      </header>

      <div className="weather-widget__content" aria-live="polite">
        {error ? (
          <p className="weather-widget__error" role="alert">Nepavyko gauti orų duomenų.</p>
        ) : weather ? (
          <p className="weather-widget__temperature">
            {weather.temperature.toLocaleString("lt-LT", { maximumFractionDigits: 1 })}
            <span> °C</span>
          </p>
        ) : (
          <p className="weather-widget__status">Kraunami orų duomenys....</p>
        )}
      </div>

      {weather && (
        <p className="weather-widget__updated">
          Paskutinį kartą atnaujinta: {" "}
          <time dateTime={weather.updatedAt.toISOString()}>
            {weather.updatedAt.toLocaleString("lt-LT", {
              timeZone: "Europe/Vilnius",
              month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
            })}
          </time>
        </p>
      )}
      <a className="weather-widget__source" href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
        Orų duomenys: Open-Meteo
      </a>
    </section>
  );
}

export default WeatherWidget;
