import type { WeatherData, Coordinates } from "@/types";

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;

interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
  visibility: number;
}

interface AirPollutionResponse {
  list: Array<{
    main: {
      aqi: number;
    };
  }>;
}

const AQI_LABELS: Record<number, string> = {
  1: "Good",
  2: "Fair",
  3: "Moderate",
  4: "Poor",
  5: "Very Poor",
};

/**
 * Fetch weather data from OpenWeatherMap
 */
export async function fetchWeatherData(coords: Coordinates): Promise<WeatherData> {
  if (!OPENWEATHERMAP_API_KEY) {
    console.warn("OpenWeatherMap API key not set, returning mock data");
    return getMockWeatherData();
  }

  try {
    const { latitude, longitude } = coords;
    
    // Fetch current weather and air pollution in parallel
    const [weatherRes, aqiRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}`
      ),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Weather API error: ${weatherRes.status}`);
    }

    const weatherData: OpenWeatherResponse = await weatherRes.json();
    
    let aqi: number | null = null;
    let aqi_label: string | null = null;
    
    if (aqiRes.ok) {
      const aqiData: AirPollutionResponse = await aqiRes.json();
      if (aqiData.list?.[0]?.main?.aqi) {
        aqi = aqiData.list[0].main.aqi;
        aqi_label = AQI_LABELS[aqi] ?? null;
      }
    }

    // Note: For pressure trend, we'd need historical data
    // In a full implementation, we'd store and compare with previous readings
    const pressure_trend = "stable" as const;
    const pressure_change_3h = 0;

    return {
      temperature: Math.round(weatherData.main.temp * 10) / 10,
      feels_like: Math.round(weatherData.main.feels_like * 10) / 10,
      pressure: weatherData.main.pressure,
      pressure_trend,
      pressure_change_3h,
      humidity: weatherData.main.humidity,
      weather_condition: weatherData.weather[0]?.main ?? "Unknown",
      weather_description: weatherData.weather[0]?.description ?? "Unknown",
      wind_speed: Math.round(weatherData.wind.speed * 10) / 10,
      clouds: weatherData.clouds.all,
      visibility: weatherData.visibility,
      aqi,
      aqi_label,
    };
  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    return getMockWeatherData();
  }
}

function getMockWeatherData(): WeatherData {
  return {
    temperature: 12.5,
    feels_like: 10.2,
    pressure: 1013,
    pressure_trend: "stable",
    pressure_change_3h: 0,
    humidity: 65,
    weather_condition: "Clouds",
    weather_description: "scattered clouds",
    wind_speed: 3.5,
    clouds: 40,
    visibility: 10000,
    aqi: null,
    aqi_label: null,
  };
}
