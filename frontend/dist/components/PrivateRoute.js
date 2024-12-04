import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
export default function PrivateRoute({ children }) {
    const token = localStorage.getItem('token');
    if (!token) {
        return _jsx(Navigate, { to: "/signin", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
