import { Router, Route } from "wouter";
import { GoLivePage } from "./pages/GoLivePage";
import { StreamViewerPage } from "./pages/StreamViewerPage";
import "./index.css";

export function App() {
  return (
    <Router>
      <Route path="/" component={GoLivePage} />
      <Route path="/stream/:nevent" component={StreamViewerPage} />
      
      {/* Fallback for unknown routes */}
      <Route>
        <div className="container">
          <h1 className="pyramid-title">404</h1>
          <div style={{
            fontFamily: 'Times New Roman, Times, serif',
            textAlign: 'center'
          }}>
            Unknown route. Go to <a href="/">home</a> to start streaming.
          </div>
        </div>
      </Route>
    </Router>
  );
}

export default App;