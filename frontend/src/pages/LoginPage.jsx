import React, { useState, useEffect, useRef } from 'react';
import '../styles/LoginPage.css'; // Assuming you have a CSS file for styles

const LoginPage = () => {
  const canvasRef = useRef(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [superUserModal, setSuperUserModal] = useState(false);
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [buttonStates, setButtonStates] = useState({
    login: 'Login',
    superUser: 'Verify',
    forgotPassword: 'Send Reset Link'
  });

  // Animation state
  const animationRef = useRef();
  const pointsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  // Configuration for surface sampling animation
  const config = {
    connectionDistance: window.innerWidth < 768 ? 80 : 120,
    mouseInfluence: window.innerWidth < 768 ? 100 : 150,
    waveAmplitude: window.innerWidth < 768 ? 30 : 50,
    waveFrequency: 0.002,
    pointSize: window.innerWidth < 768 ? 1.5 : 2,
    lineOpacity: 0.3,
    pointOpacity: 0.8
  };

  // Point class for animation
  class Point {
    constructor(x, y) {
      this.originalX = x;
      this.originalY = y;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
    }

    update(time, config, mouse) {
      const waveX = Math.sin(time * config.waveFrequency + this.originalX * 0.01) * config.waveAmplitude;
      const waveY = Math.cos(time * config.waveFrequency + this.originalY * 0.01) * config.waveAmplitude * 0.5;
      
      const targetX = this.originalX + waveX;
      const targetY = this.originalY + waveY;
      
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < config.mouseInfluence) {
        const force = (config.mouseInfluence - distance) / config.mouseInfluence;
        const angle = Math.atan2(dy, dx);
        this.vx += Math.cos(angle) * force * 0.5;
        this.vy += Math.sin(angle) * force * 0.5;
      }
      
      this.vx += (targetX - this.x) * 0.02;
      this.vy += (targetY - this.y) * 0.02;
      
      this.vx *= 0.95;
      this.vy *= 0.95;
      
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx, config) {
      ctx.save();
      ctx.globalAlpha = config.pointOpacity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, config.pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Initialize animation points
  const initPoints = (canvas) => {
    const points = [];
    const spacing = window.innerWidth < 768 ? 60 : 80;
    const offsetX = (canvas.width % spacing) / 2;
    const offsetY = (canvas.height % spacing) / 2;
    
    for (let x = offsetX; x < canvas.width; x += spacing) {
      for (let y = offsetY; y < canvas.height; y += spacing) {
        const randomX = x + (Math.random() - 0.5) * 20;
        const randomY = y + (Math.random() - 0.5) * 20;
        points.push(new Point(randomX, randomY));
      }
    }
    return points;
  };

  // Draw connections between points
  const drawConnections = (ctx, points, config) => {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.connectionDistance) {
          const opacity = (config.connectionDistance - distance) / config.connectionDistance * config.lineOpacity;
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    timeRef.current++;
    
    ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    pointsRef.current.forEach(point => {
      point.update(timeRef.current, config, mouseRef.current);
    });
    
    drawConnections(ctx, pointsRef.current, config);
    
    pointsRef.current.forEach(point => {
      point.draw(ctx, config);
    });
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Setup canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      pointsRef.current = initPoints(canvas);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      mouseRef.current = { x: touch.clientX, y: touch.clientY };
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Notification system
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Form handlers
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username && loginForm.password) {
      setButtonStates(prev => ({ ...prev, login: 'Logging in...' }));
      
      setTimeout(() => {
        showNotification(`Welcome to Kluger DART, ${loginForm.username}! System access granted.`, 'success');
        setButtonStates(prev => ({ ...prev, login: 'Login' }));
      }, 2000);
    }
  };

  const handleSuperUserSubmit = (e) => {
    e.preventDefault();
    if (passkey) {
      setButtonStates(prev => ({ ...prev, superUser: 'Verifying...' }));
      
      setTimeout(() => {
        if (passkey === 'DART2024' || passkey === 'admin' || passkey === 'superuser') {
          setButtonStates(prev => ({ ...prev, superUser: 'Access Granted' }));
          setTimeout(() => {
            showNotification('Super User Access Granted! Welcome to Kluger DART Advanced Systems.', 'success');
            closeSuperUserModal();
          }, 1000);
        } else {
          setButtonStates(prev => ({ ...prev, superUser: 'Invalid Passkey' }));
          setTimeout(() => {
            setButtonStates(prev => ({ ...prev, superUser: 'Verify' }));
            setPasskey('');
          }, 2000);
        }
      }, 1500);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (resetEmail) {
      setButtonStates(prev => ({ ...prev, forgotPassword: 'Sending...' }));
      
      setTimeout(() => {
        if (resetEmail.includes('@') || resetEmail === 'admin' || resetEmail === 'user') {
          setButtonStates(prev => ({ ...prev, forgotPassword: 'Email Sent' }));
          setTimeout(() => {
            showNotification(`Password reset instructions have been sent to ${resetEmail}. Please check your email.`, 'success');
            closeForgotPasswordModal();
          }, 1000);
        } else {
          setButtonStates(prev => ({ ...prev, forgotPassword: 'User Not Found' }));
          setTimeout(() => {
            setButtonStates(prev => ({ ...prev, forgotPassword: 'Send Reset Link' }));
            setResetEmail('');
          }, 2000);
        }
      }, 1500);
    }
  };

  // Modal handlers
  const openSuperUserModal = () => {
    setSuperUserModal(true);
    setTimeout(() => document.getElementById('passkey')?.focus(), 100);
  };

  const closeSuperUserModal = () => {
    setSuperUserModal(false);
    setPasskey('');
    setButtonStates(prev => ({ ...prev, superUser: 'Verify' }));
  };

  const openForgotPasswordModal = () => {
    setForgotPasswordModal(true);
    setTimeout(() => document.getElementById('resetEmail')?.focus(), 100);
  };

  const closeForgotPasswordModal = () => {
    setForgotPasswordModal(false);
    setResetEmail('');
    setButtonStates(prev => ({ ...prev, forgotPassword: 'Send Reset Link' }));
  };

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (superUserModal) closeSuperUserModal();
        if (forgotPasswordModal) closeForgotPasswordModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [superUserModal, forgotPasswordModal]);

  return (
    <div className="login-page">
      {/* Canvas for Surface Sampling Animation */}
      <canvas ref={canvasRef} className="background-canvas" />

      {/* Main Content */}
      <div className="main-content">
        <div className="login-container">
          {/* Company Title */}
          <div className="company-header">
            <h1 className="company-name">Kluger DART</h1>
            <p className="company-tagline">Design • Automation • Telemetry • Robotics</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="login-btn">
              {buttonStates.login}
            </button>
          </form>

          {/* Form Footer */}
          <div className="form-footer">
            <button 
              type="button" 
              className="form-link" 
              onClick={openForgotPasswordModal}
            >
              Forgot Password?
            </button>
            <span className="separator">|</span>
            <button 
              type="button" 
              className="form-link" 
              onClick={openSuperUserModal}
            >
              Super User Login
            </button>
          </div>
        </div>
      </div>

      {/* Super User Modal */}
      {superUserModal && (
        <div className="modal-backdrop" onClick={closeSuperUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon blue-gradient">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <h2>Super User Access</h2>
              <p>Enter your security passkey</p>
            </div>
            
            <form onSubmit={handleSuperUserSubmit}>
              <div className="form-group">
                <label htmlFor="passkey">Security Passkey</label>
                <input
                  type="password"
                  id="passkey"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter passkey"
                  required
                />
              </div>
              
              <div className="modal-buttons">
                <button 
                  type="submit" 
                  className={`modal-btn ${
                    buttonStates.superUser === 'Verifying...' ? 'warning' :
                    buttonStates.superUser === 'Access Granted' ? 'success' :
                    buttonStates.superUser === 'Invalid Passkey' ? 'error' : 'primary'
                  }`}
                >
                  {buttonStates.superUser}
                </button>
                <button type="button" className="modal-btn secondary" onClick={closeSuperUserModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotPasswordModal && (
        <div className="modal-backdrop" onClick={closeForgotPasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon purple-gradient">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h2>Reset Password</h2>
              <p>Enter your email or username to receive reset instructions</p>
            </div>
            
            <form onSubmit={handleForgotPasswordSubmit}>
              <div className="form-group">
                <label htmlFor="resetEmail">Email or Username</label>
                <input
                  type="text"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email or username"
                  required
                />
              </div>
              
              <div className="modal-buttons">
                <button 
                  type="submit" 
                  className={`modal-btn ${
                    buttonStates.forgotPassword === 'Sending...' ? 'warning' :
                    buttonStates.forgotPassword === 'Email Sent' ? 'success' :
                    buttonStates.forgotPassword === 'User Not Found' ? 'error' : 'primary'
                  }`}
                >
                  {buttonStates.forgotPassword}
                </button>
                <button type="button" className="modal-btn secondary" onClick={closeForgotPasswordModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type}`}
          >
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoginPage;