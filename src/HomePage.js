import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { Particles } from "@tsparticles/react";
import './HomePage.css';

function HomePage() {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setSchoolInfo({
        name: "ESTAPAUL Group of Schools",
        logo_url: "https://bqzqgpvklburfthmhlpq.supabase.co/storage/v1/object/public/school-media//logo.png",
        motto: "Knowledge, Character, Excellence (One with God)",
        established: "2010",
        propietor: "Mr. OlaBode",
        principal_name: "Mr. Olusegun",
        address: "Igedora, Igede Ekiti",
        description: "ESTAPAUL GROUP OF SCHOOLS is a leading educational institution providing quality education from Creche to Senior Secondary levels. We nurture young minds to excel academically and morally, fostering a holistic learning environment.",
        admissions: "Admissions are open for new academic sessions. Visit our school or website for application details.",
        academics: "Our curriculum is robust, designed to meet national standards, and delivered by experienced educators.",
        phone: "+234 8104727116",
        email: "info@estapaulschools.edu"
      });
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
      <Particles
        options={{
          fullScreen: { enable: false },
          background: { color: { value: "#e0eafc" } },
          particles: {
            color: { value: "#fe7e5f" },
            links: { enable: true, color: "#fe7e5f", distance: 140 },
            move: { enable: true, speed: 1 },
            number: { value: 30 },
            opacity: { value: 0.2 },
            shape: { type: "circle" },
            size: { value: 3 },
          }
        }}
        style={{
          position: "absolute",
          zIndex: 0,
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh"
        }}
      />

      {schoolInfo && (
        <>
          <motion.section
            className="hero"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.img
              src={schoolInfo.logo_url}
              alt="School Logo"
              className="school-logo animated-logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.4 }}
              onError={e => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/200x200.png?text=ESTAPAUL+Logo";
              }}
            />
            <motion.h1 className="school-name"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {schoolInfo.name}
            </motion.h1>
            <motion.p className="school-motto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              "{schoolInfo.motto}"
            </motion.p>
            <motion.a
              href="/admissions"
              className="cta-button"
              whileHover={{ scale: 1.07, background: "linear-gradient(90deg, #1a2c5b 50%, #fe7e5f 100%)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Apply Now
            </motion.a>
          </motion.section>

          <main className="info-grid">
            <motion.div className="info-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <h2>About Our School</h2>
              <p>{schoolInfo.description}</p>
              <div className="info-list">
                <div><strong>Established:</strong> {schoolInfo.established}</div>
                <div><strong>Principal:</strong> {schoolInfo.principal_name}</div>
                <div><strong>Address:</strong> {schoolInfo.address}</div>
              </div>
            </motion.div>
            <motion.div className="info-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <h2>Admissions</h2>
              <p>{schoolInfo.admissions}</p>
            </motion.div>
            <motion.div className="info-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <h2>Academics</h2>
              <p>{schoolInfo.academics}</p>
            </motion.div>
            <motion.div className="info-card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <h2>Contact Us</h2>
              <p><strong>Phone:</strong> {schoolInfo.phone}</p>
              <p><strong>Email:</strong> <a href={`mailto:${schoolInfo.email}`}>{schoolInfo.email}</a></p>
            </motion.div>
          </main>
        </>
      )}
    </div>
  );
}

export default HomePage;