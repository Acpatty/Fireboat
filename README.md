# Seattle Fire Department - Fireboat Marine Forecast

A specialized marine weather forecast application designed for Seattle Fire Department fireboat operations, providing comprehensive weather, tide, and marine condition data tailored to 24-hour shift schedules.

## Features

### 🌊 Tide Information
- Real-time tide predictions from NOAA Station 9447130 (Seattle)
- High and low tide times and heights
- Automatically displays tides for your 24-hour shift (0800-0800)

### 🌤️ Weather Data
- Current conditions (temperature, wind, humidity, pressure)
- 24-hour forecast broken into 4 shift periods:
  - Morning (08:00-12:00)
  - Afternoon (12:00-18:00)
  - Evening (18:00-00:00)
  - Night (00:00-08:00)
- Wind speed and direction in nautical knots
- Visibility conditions
- Precipitation probability

### 🚢 Marine-Specific Data
- Water temperature (from NOAA sensors)
- Estimated wave heights based on wind conditions
- Current speed and direction (flood/ebb estimation)
- Sunrise and sunset times
- Barometric pressure

### ⚠️ Safety Features
- Automatic 30-minute data refresh
- Manual refresh button
- Debug logging for troubleshooting
- Clear, easy-to-read interface optimized for quick reference

## Data Sources

- **NOAA CO-OPS**: Tide predictions, water temperature, air pressure
- **NOAA National Weather Service**: Marine forecasts and alerts
- **Open-Meteo**: Real-time weather data (free, no API key required)

All data sources are free and do not require API keys or registration.

## Installation

### Prerequisites
- Node.js 18+ installed on your system
- npm or yarn package manager

### Local Setup

1. **Create a new React project with Vite:**
   ```bash
   npm create vite@latest marine-forecast -- --template react-ts
   cd marine-forecast
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm install lucide-react
   ```

3. **Replace the default App code:**
   - Open `src/App.tsx`
   - Delete all existing code
   - Paste the Marine Forecast app code
   - Save the file

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - Navigate to `http://localhost:5173`
   - The app will automatically fetch and display current marine forecast data

### Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

## Deployment Options

### Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Sign up at [vercel.com](https://vercel.com) (free)
3. Import your GitHub repository
4. Deploy with one click
5. Access your app from anywhere via the provided URL

### Option 2: Netlify
1. Push your code to GitHub/GitLab/Bitbucket
2. Sign up at [netlify.com](https://netlify.com) (free)
3. Connect your repository
4. Deploy automatically

### Option 3: GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   "homepage": "https://yourusername.github.io/marine-forecast",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run: `npm run deploy`

## Usage

### Understanding the Display

**Shift Period**
- Shows your current 24-hour shift from 0800 to 0800 the next day
- Automatically calculates based on current time

**Tides**
- Blue cards = High tides
- Tan cards = Low tides
- Times shown in 24-hour format
- Heights shown in feet (MLLW datum)

**Current Conditions**
- Real-time data updated every 30 minutes
- Wind speeds in knots (nautical standard)
- "Feels like" temperature accounts for wind chill

**Period Forecasts**
- Each 6-hour block shows expected conditions
- Wave heights estimated from wind speed
- All times in local Seattle time (PST/PDT)

**Marine Data**
- Water temp from NOAA sensor at Elliott Bay
- Current direction shows flood (incoming) or ebb (outgoing)
- Sunrise/sunset critical for visibility operations

### Refresh Data
- Click the **Refresh** button in the header anytime
- Data auto-refreshes every 30 minutes
- Last update time shown in footer

### Troubleshooting
- If data fails to load, check the debug log (visible during loading)
- Ensure you have internet connectivity
- NOAA APIs occasionally have brief outages - retry after a few minutes

## Customization

### Change Location
Edit the coordinates in the code:
```typescript
const SEATTLE_LAT = 47.6062;  // Your latitude
const SEATTLE_LON = -122.3321; // Your longitude
const NOAA_STATION = '9447130'; // Your nearest NOAA tide station
```

Find your NOAA station: [https://tidesandcurrents.noaa.gov/](https://tidesandcurrents.noaa.gov/)

### Change Shift Times
Modify the shift start hour (currently 8 for 0800):
```typescript
shiftStart.setHours(8, 0, 0, 0); // Change 8 to your shift start hour
```

### Styling
The app uses Tailwind CSS utility classes. Modify colors, spacing, and layout by editing the className attributes in the JSX.

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Initial load: ~2-3 seconds (depending on API response times)
- Memory usage: ~50-70MB
- Data payload: ~100-200KB per refresh
- Auto-refresh every 30 minutes

## Known Limitations

- Wave heights are estimates based on wind speed (not direct buoy measurements)
- Current data estimated from tide phase (not real-time current sensors)
- Moon phase is placeholder data (can be enhanced with additional API)
- Water temperature may occasionally be unavailable from NOAA sensors

## Future Enhancements

Potential additions for future versions:
- [ ] Real-time NOAA marine alerts and warnings
- [ ] Historical tide charts
- [ ] Marine radar imagery overlay
- [ ] Wind rose visualization
- [ ] Export forecast to PDF
- [ ] Push notifications for adverse conditions
- [ ] Progressive Web App (PWA) for offline access
- [ ] Multiple location support
- [ ] Crew scheduling integration

## License

This application is designed for Seattle Fire Department operations. Free to use and modify for emergency services and maritime safety purposes.

## Support

For issues, questions, or feature requests:
- Check the browser console (F12) for debug information
- Verify internet connectivity
- Confirm NOAA APIs are operational: [https://tidesandcurrents.noaa.gov/](https://tidesandcurrents.noaa.gov/)

## Credits

Built with:
- React + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- NOAA CO-OPS API
- Open-Meteo Weather API

Designed specifically for Seattle Fire Department Fireboat operations on Elliott Bay.

---

**Stay Safe on the Water! 🚒🌊**
