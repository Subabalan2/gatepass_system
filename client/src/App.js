import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Loginform from "./components/Loginform.jsx";
import GatepassForm from "./components/GatepassForm.jsx";
import StaffsLogin from "./components/StaffsLogin.jsx";
import DashBoard from "./components/DashBoard.jsx";
import Homepage from "./components/Homepage.jsx";
import StaffsApproval from "./components/StaffsApproval.jsx";
import HodApproval from "./components/HodApproval.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import LoginChoice from "./components/LoginChoice.jsx";
import HodLogin from "./components/HodLogin.jsx";
import GatepassReceipt from "./components/GatepassReceipt.jsx";
import ReceiptPage from "./components/ReceiptPage.jsx";


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/loginpage" element={<Loginform />} />
          <Route path="/gatepass" element={<GatepassForm />} />
          <Route path="/staffslogin" element={<StaffsLogin />} />
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/staffs-Approval" element={<StaffsApproval />} />
          <Route path="/hod-approval" element={<HodApproval />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/loginchoice" element={<LoginChoice />} />
          <Route path="/hod-login" element={<HodLogin />} />
          <Route path="/receipt" element={<GatepassReceipt />} />
          <Route path="/showreceipt" element={< ReceiptPage/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;



