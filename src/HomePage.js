// frontend/src/HomePage.js
import React, { useEffect, useState } from 'react';

function HomePage() {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call with your actual school data
    const timer = setTimeout(() => {
      const mockSchoolInfo = {
        name: "ESTAPAUL Group of Schools",
        logo_url: "https://bqzqgpvklburfthmhlpq.supabase.co/storage/v1/object/public/school-media//logo.png",
        motto: "Knowledge, Character, Excellence",
        established: "2010",
        principal_name: "Mr. Olusegun",
        address: "Igedora, Igede Ekiti",
        description: "ESTAPAUL GROUP OF SCHOOLS is a leading educational institution providing quality education from Creche to Senior Secondary levels. We nurture young minds to excel academically and morally, fostering a holistic learning environment.",
        admissions: "Admissions are open for new academic sessions. Visit our school or website for application details.",
        academics: "Our curriculum is robust, designed to meet national standards, and delivered by experienced educators.",
        phone: "+234 8104727116",
        email: "info@estapaulschools.edu"
      };
      
      setSchoolInfo(mockSchoolInfo);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="homepage-content">
        <div className="loading-text">Loading school information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage-content">
        <div className="info-block">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage-content">
      {schoolInfo && (
        <>
          <div className="homepage-text-section">
            <h2>Welcome to {schoolInfo.name}</h2>
            <p className="tagline">"{schoolInfo.motto}"</p>
            
            <div className="info-block">
              <p><strong>Established:</strong> {schoolInfo.established}</p>
              <p><strong>Principal:</strong> {schoolInfo.principal_name}</p>
              <p><strong>Address:</strong> {schoolInfo.address}</p>
            </div>

            <h3>About Our School</h3>
            <p>{schoolInfo.description}</p>
          </div>

          <div className="homepage-image-section">
            <img 
              src={schoolInfo.logo_url} 
              alt="School Logo" 
              className="school-logo" 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = "https://via.placeholder.com/300x150.png?text=ESTAPAUL+Logo"
              }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h3>Admissions</h3>
            <div className="info-block">
              <p>{schoolInfo.admissions}</p>
            </div>

            <h3>Academics</h3>
            <div className="info-block">
              <p>{schoolInfo.academics}</p>
            </div>

            <h3>Contact Us</h3>
            <div className="info-block">
              <p><strong>Phone:</strong> {schoolInfo.phone}</p>
              <p><strong>Email:</strong> {schoolInfo.email}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HomePage;