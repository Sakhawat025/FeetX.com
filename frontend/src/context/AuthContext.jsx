import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../services/authApi";
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("feetx_token"));
    const [loading, setLoading] = useState(true);

    // Check existing login
    useEffect(() => {
    const savedToken = localStorage.getItem("feetx_token");

    if (savedToken) {
        getMe()
            .then((data) => {
                setUser(data);
            })
            .catch(() => {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem("feetx_token");
                    localStorage.removeItem("feetx_user");
            })
            .finally(() => {
                setLoading(false);
            });
    } else {
        setLoading(false);
    }
  }, []);


    // Login Function
    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);

        localStorage.setItem("feetx_user", JSON.stringify(userData));
        localStorage.setItem("feetx_token", userToken);
    };

    // Logout Function
    const logout = () => {
        setUser(null);
        setToken(null);

        localStorage.removeItem("feetx_user");
        localStorage.removeItem("feetx_token");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
