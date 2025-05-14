import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import './Grievance.css';

const Grievance = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Using the newer @emailjs/browser package
      const response = await emailjs.send(
        'service_yzcqsyi', // Your service ID
        'template_ewjkelp', // Your template ID
        {
          to_email: '2022a1r059@mietjammu.in',
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message
        },
        'kKHKoG28NOQ_lkr54' // Your public key (user ID)
      );
      // the graviance is working properly and with no errors

      if (response.status === 200) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grievance-modal">
      <div className="grievance-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Submit a feedback</h2>
        
        {submitStatus === 'success' && (
          <div className="success-message">
            Your feedback has been submitted successfully!
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className="error-message">
            Failed to submit grievance. Please try again.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Grievance'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Grievance;