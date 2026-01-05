import { useState, useEffect } from 'react';
import { Cloud, Wind, Waves, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface Tide {
  time: string;
  type: string;
  height: string;
}

interface CurrentConditions {
  temp: string;
  feelsLike: string;
  conditions: string;
  windSpeed: string;
  windDir: string;
  gusts: string;
  pressure: string;
  humidity: string;
}

interface PeriodForecast {
  period: string;
  temp: string;
  conditions: string;
  wind: string;
  visibility: string;
  precipitation: string;
  waves: string;
}

interface MarineData {
  waterTemp: string;
  currentSpeed: string;
  currentDir: string;
  sunrise: string;
  sunset: string;
}

interface ForecastData {
  location: string;
  shiftStart: string;
  shiftEnd: string;
  tides: Tide[];
  conditions: {
    current: CurrentConditions;
    forecast: PeriodForecast[];
  };
  marine: MarineData;
}

const MarineForecastApp = () => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const SEATTLE_LAT = 47.6062;
  const SEATTLE_LON = -122.3321;
  const NOAA_STATION = '9447130';

  const addLog = (msg: string) => {
    console.log(msg);
    setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    setDebugLog([]);
    
    try {
      addLog('Starting forecast fetch...');
      
      const now = new Date();
      const shiftStart = new Date(now);
      shiftStart.setHours(8, 0, 0, 0);
      if (now.getHours() < 8) {
        shiftStart.setDate(shiftStart.getDate() - 1);
      }
      const shiftEnd = new Date(shiftStart);
      shiftEnd.setDate(shiftEnd.getDate() + 1);
      shiftEnd.setHours(8, 0, 0, 0);

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };

      const today = formatDate(shiftStart);
      const tomorrow = formatDate(shiftEnd);

      addLog('Fetching weather data from Open-Meteo...');
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${SEATTLE_LAT}&longitude=${SEATTLE_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=kn&precipitation_unit=inch&timezone=America/Los_Angeles`;
      
      const weatherResponse = await fetch(weatherUrl);
      if (!weatherResponse.ok) {
        throw new Error(`Weather API returned ${weatherResponse.status}`);
      }
      const weatherData = await weatherResponse.json();
      addLog('Weather data received successfully');

      addLog('Fetching tide data from NOAA...');
      let tides: Tide[] = [];
      try {
        const tideUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${today}&end_date=${tomorrow}&station=${NOAA_STATION}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;
        const tideResponse = await fetch(tideUrl);
        const tideData = await tideResponse.json();
        
        if (tideData.predictions) {
          tides = tideData.predictions.slice(0, 4).map((tide: any) => {
            const time = new Date(tide.t);
            return {
              time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              type: tide.type === 'H' ? 'High' : 'Low',
              height: `${parseFloat(tide.v).toFixed(1)} ft`
            };
          });
          addLog(`Tide data received: ${tides.length} tides`);
        }
      } catch (e) {
        addLog(`Tide fetch failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }

      addLog('Fetching water temperature from NOAA...');
      let waterTemp = '52°F';
      try {
        const waterTempUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${NOAA_STATION}&product=water_temperature&date=latest&time_zone=lst_ldt&units=english&format=json`;
        const waterTempResponse = await fetch(waterTempUrl);
        const waterTempData = await waterTempResponse.json();
        if (waterTempData.data && waterTempData.data.length > 0) {
          waterTemp = `${Math.round(parseFloat(waterTempData.data[0].v))}°F`;
          addLog(`Water temp: ${waterTemp}`);
        }
      } catch (e) {
        addLog(`Water temp unavailable: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }

      const getWeatherDescription = (code: number): string => {
        const codes: Record<number, string> = {
          0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
          45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle',
          55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
          71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 80: 'Light Showers',
          81: 'Showers', 82: 'Heavy Showers', 95: 'Thunderstorm'
        };
        return codes[code] || 'Unknown';
      };

      const getWindDirection = (degrees: number): string => {
        const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return dirs[Math.round(degrees / 22.5) % 16];
      };

      const metersToMiles = (meters: number): string => {
        return (meters / 1609.34).toFixed(1);
      };

      let currentSpeed = 'Variable';
      let currentDir = 'Variable';
      if (tides.length >= 2) {
        if (tides[0].type === 'Low' && tides[1].type === 'High') {
          currentDir = 'Flood (incoming)';
          currentSpeed = '0.5-1.5 kt';
        } else if (tides[0].type === 'High' && tides[1].type === 'Low') {
          currentDir = 'Ebb (outgoing)';
          currentSpeed = '0.5-1.5 kt';
        }
      }

      addLog('Creating period forecasts...');
      const currentHour = now.getHours();
      const periods = [
        { name: 'Morning (08:00-12:00)', start: 8, end: 12 },
        { name: 'Afternoon (12:00-18:00)', start: 12, end: 18 },
        { name: 'Evening (18:00-00:00)', start: 18, end: 24 },
        { name: 'Night (00:00-08:00)', start: 0, end: 8 }
      ];

      const periodForecasts: PeriodForecast[] = periods.map(period => {
        let startIdx, endIdx;
        
        if (period.start < 8) {
          startIdx = 24 - currentHour + period.start;
          endIdx = 24 - currentHour + period.end;
        } else {
          startIdx = period.start - currentHour;
          endIdx = period.end - currentHour;
        }

        startIdx = Math.max(0, startIdx);
        endIdx = Math.min(weatherData.hourly.time.length - 1, endIdx);

        if (startIdx >= endIdx) {
          return {
            period: period.name,
            temp: 'N/A',
            conditions: 'N/A',
            wind: 'N/A',
            visibility: 'N/A',
            precipitation: 'N/A',
            waves: 'N/A'
          };
        }

        const temps = weatherData.hourly.temperature_2m.slice(startIdx, endIdx);
        const precips = weatherData.hourly.precipitation_probability.slice(startIdx, endIdx);
        const winds = weatherData.hourly.wind_speed_10m.slice(startIdx, endIdx);
        const gusts = weatherData.hourly.wind_gusts_10m.slice(startIdx, endIdx);
        const windDirs = weatherData.hourly.wind_direction_10m.slice(startIdx, endIdx);
        const visibility = weatherData.hourly.visibility.slice(startIdx, endIdx);
        const weatherCodes = weatherData.hourly.weather_code.slice(startIdx, endIdx);

        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);
        const maxPrecip = Math.max(...precips);
        const avgWind = (winds.reduce((a: number, b: number) => a + b, 0) / winds.length).toFixed(0);
        const maxGust = Math.max(...gusts).toFixed(0);
        const avgWindDir = getWindDirection(windDirs.reduce((a: number, b: number) => a + b, 0) / windDirs.length);
        const minVis = Math.min(...visibility);
        const dominantWeather = getWeatherDescription(weatherCodes[Math.floor(weatherCodes.length / 2)]);
        const avgWindNum = parseFloat(avgWind);
        const waveHeight = avgWindNum < 10 ? '1-2 ft' : avgWindNum < 15 ? '2-3 ft' : avgWindNum < 20 ? '3-5 ft' : '4-6 ft';

        return {
          period: period.name,
          temp: `${Math.round(minTemp)}-${Math.round(maxTemp)}°F`,
          conditions: dominantWeather,
          wind: `${avgWind} kt ${avgWindDir} (Gusts ${maxGust} kt)`,
          visibility: `${metersToMiles(minVis)} mi`,
          precipitation: `${maxPrecip}%`,
          waves: waveHeight
        };
      });

      addLog('Building final forecast object...');
      const forecastObj: ForecastData = {
        location: "Elliott Bay, Seattle",
        shiftStart: shiftStart.toLocaleString('en-US', { 
          weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        shiftEnd: shiftEnd.toLocaleString('en-US', { 
          weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        tides: tides,
        conditions: {
          current: {
            temp: `${Math.round(weatherData.current.temperature_2m)}°F`,
            feelsLike: `${Math.round(weatherData.current.apparent_temperature)}°F`,
            conditions: getWeatherDescription(weatherData.current.weather_code),
            windSpeed: `${Math.round(weatherData.current.wind_speed_10m)} kt`,
            windDir: getWindDirection(weatherData.current.wind_direction_10m),
            gusts: `${Math.round(weatherData.current.wind_gusts_10m)} kt`,
            pressure: `${(weatherData.current.pressure_msl / 33.864).toFixed(2)} inHg`,
            humidity: `${weatherData.current.relative_humidity_2m}%`
          },
          forecast: periodForecasts
        },
        marine: {
          waterTemp: waterTemp,
          currentSpeed: currentSpeed,
          currentDir: currentDir,
          sunrise: new Date(weatherData.daily.sunrise[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          sunset: new Date(weatherData.daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
        }
      };

      addLog('Forecast complete!');
      setForecast(forecastObj);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`ERROR: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <RefreshCw className="animate-spin w-12 h-12 mx-auto mb-4" />
          <div className="text-xl mb-4">Loading Marine Forecast...</div>
          <div className="bg-slate-800 rounded p-4 max-w-md text-left text-sm">
            {debugLog.map((log, idx) => (
              <div key={idx} className="text-slate-300">{log}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 max-w-2xl text-white">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Forecast</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchForecast}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition mb-4"
          >
            Retry
          </button>
          <div className="bg-slate-800 rounded p-4 text-sm max-h-60 overflow-y-auto">
            <div className="font-bold mb-2">Debug Log:</div>
            {debugLog.map((log, idx) => (
              <div key={idx} className="text-slate-300">{log}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!forecast) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-600 text-white rounded-t-lg p-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Seattle Fire Department</h1>
              <p className="text-xl">Fireboat Marine Forecast</p>
              <p className="text-sm opacity-90 mt-1">{forecast.location}</p>
            </div>
            <button 
              onClick={fetchForecast}
              className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-slate-800 text-white p-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5" />
            <span className="font-bold">24-Hour Shift Period</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">Start:</span> {forecast.shiftStart}</div>
            <div><span className="text-slate-400">End:</span> {forecast.shiftEnd}</div>
          </div>
        </div>

        <div className="bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Cloud className="w-6 h-6" />
            Current Conditions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-slate-600">Temperature</div>
              <div className="text-2xl font-bold text-slate-800">{forecast.conditions.current.temp}</div>
              <div className="text-xs text-slate-600">Feels like {forecast.conditions.current.feelsLike}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-slate-600">Conditions</div>
              <div className="text-lg font-semibold text-slate-800">{forecast.conditions.current.conditions}</div>
            </div>
 <div className="bg-blue-50 p-4 rounded">
  <div className="text-sm text-slate-600 flex items-center gap-1">
    <Wind className="w-4 h-4" />
    Wind
  </div>
  <div className="text-xl font-bold text-slate-800">{forecast.conditions.current.windSpeed}</div>
  <div className="text-sm text-slate-600">{forecast.conditions.current.windDir} (Gusts {forecast.conditions.current.gusts})</div>
</div>           
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-sm text-slate-600">Humidity</div>
              <div className="text-2xl font-bold text-slate-800">{forecast.conditions.current.humidity}</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Waves className="w-6 h-6" />
            Tides - NOAA Station {NOAA_STATION}
          </h2>
          {forecast.tides.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-4">
              {forecast.tides.map((tide, idx) => (
                <div key={idx} className={`p-4 rounded ${tide.type === 'High' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-amber-50 dark:bg-amber-900/40'} dark:border dark:border-slate-600`}>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{tide.type} Tide</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{tide.time}</div>
                  <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">{tide.height}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-600">Tide data temporarily unavailable</div>
          )}
        </div>

        <div className="bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Shift Period Forecast</h2>
          <div className="space-y-4">
            {forecast.conditions.forecast.map((period, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600">
                <div className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">{period.period}</div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-slate-600 dark:text-slate-300">Temperature:</span> <span className="ml-2 font-semibold">{period.temp}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-300">Conditions:</span> <span className="ml-2 font-semibold">{period.conditions}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-300">Precipitation:</span> <span className="ml-2 font-semibold">{period.precipitation}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-300">Wind:</span> <span className="ml-2 font-semibold">{period.wind}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-300">Visibility:</span> <span className="ml-2 font-semibold">{period.visibility}</span></div>
                  <div><span className="text-slate-600 dark:text-slate-300">Wave Height:</span> <span className="ml-2 font-semibold text-blue-700 dark:text-blue-300">{period.waves}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Additional Marine Data</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Water Temperature</div>
              <div className="text-xl font-bold text-slate-800">{forecast.marine.waterTemp}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Current</div>
              <div className="text-xl font-bold text-slate-800">{forecast.marine.currentSpeed}</div>
              <div className="text-sm text-slate-600">{forecast.marine.currentDir}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded">
              <div className="text-sm text-slate-600">Pressure</div>
              <div className="text-xl font-bold text-slate-800">{forecast.conditions.current.pressure}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded dark:bg-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-300">Sunrise</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{forecast.marine.sunrise}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded dark:bg-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-300">Sunset</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{forecast.marine.sunset}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 text-white p-4 rounded-b-lg">
          <div className="text-sm">
            <div className="font-semibold mb-2">Data Sources: NOAA CO-OPS (Tides, Water Temp) • Open-Meteo (Weather)</div>
            {lastUpdate && (
              <div className="text-xs text-slate-400 mt-2">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarineForecastApp;