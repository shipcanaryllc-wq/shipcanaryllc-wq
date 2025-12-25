// Page recreated from archived Fleex site for ShipCanary; text and layout match snapshot 1:1 (brand-mapped).
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import './Support.css';

const Support = () => {
  const navigate = useNavigate();
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const faqCategories = [
    {
      title: 'General Questions',
      questions: [
        {
          q: 'What is ShipCanary?',
          a: 'ShipCanary is a shipping platform that helps small businesses save money on shipping labels. We offer the lowest shipping rates on the market and make it easy to create and manage your shipping labels.'
        },
        {
          q: 'How do I get started?',
          a: 'Getting started is easy! Simply sign up for a free account and you\'ll receive $10 in free credit to get started. No credit card required.'
        },
        {
          q: 'What shipping carriers do you support?',
          a: 'We currently support USPS shipping services including Priority Mail, Ground Advantage, First-Class Package, and more.'
        },
        {
          q: 'Do I need to sign a contract?',
          a: 'No, there are no contracts required. You can use ShipCanary on a pay-as-you-go basis and cancel anytime.'
        }
      ]
    },
    {
      title: 'Billing Questions',
      questions: [
        {
          q: 'How does billing work?',
          a: 'You add funds to your account balance, and we deduct the cost of each shipping label from your balance. You can add funds anytime through your dashboard.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept various payment methods including credit cards and other secure payment options. Check your dashboard for available payment methods.'
        },
        {
          q: 'Are there any hidden fees?',
          a: 'No, we believe in transparent pricing. The price you see is the price you pay. No hidden fees, no surprises.'
        },
        {
          q: 'Can I get a refund?',
          a: 'Refunds are handled on a case-by-case basis. Please contact our support team if you need assistance with a refund request.'
        }
      ]
    }
  ];

  // Flatten questions with category info for rendering
  const allQuestions = [];
  faqCategories.forEach((category, categoryIndex) => {
    category.questions.forEach((item, questionIndex) => {
      allQuestions.push({
        ...item,
        category: category.title,
        index: allQuestions.length
      });
    });
  });

  return (
    <div className="support-page">
      <Navbar />

      <main className="support-main">
        <div className="support-hero">
          <h1 className="support-title">How can we help you?</h1>
          <p className="support-subtitle">
            Discover our support resources and find answers to common questions about ShipCanary.
          </p>
          <button className="support-cta-button" onClick={() => navigate('/pricing')}>
            Contact us
          </button>
        </div>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2 className="faq-section-title">Frequently Asked Questions</h2>
          
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="faq-category">
              <h3 className="faq-category-title">{category.title}</h3>
              <div className="faq-list">
                {category.questions.map((item, questionIndex) => {
                  const globalIndex = allQuestions.findIndex(
                    q => q.q === item.q && q.category === category.title
                  );
                  const isOpen = openQuestion === globalIndex;
                  
                  return (
                    <div key={questionIndex} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button
                        className="faq-question"
                        onClick={() => toggleQuestion(globalIndex)}
                      >
                        <span className="faq-question-text">{item.q}</span>
                        <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen && (
                        <div className="faq-answer">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Support;

