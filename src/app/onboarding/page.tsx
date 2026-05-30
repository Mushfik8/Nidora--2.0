'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { countries, getCitiesForCountry, getAreasForCity } from '@/data/locations';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step === 1 && country) setStep(2);
    if (step === 2 && city) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!country || !city || !area) return;
    
    setIsSubmitting(true);
    try {
      await updateUser({
        country,
        city,
        area,
        onboardingCompleted: true,
      });
      router.push('/');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 flex items-center justify-center p-4 bg-surface-50 page-container py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-8 card-shadow-lg"
        >
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold font-[var(--font-heading)] text-surface-900 mb-2">
              Welcome to Nidora, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-surface-500">
              Let's set up your primary location to find the best verified homes near you.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  s <= step ? 'bg-primary-500' : 'bg-surface-200'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Country */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Select
                label="Select your Country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCity('');
                  setArea('');
                }}
                options={countries.map((c) => ({ value: c.name, label: c.name }))}
                placeholder="Choose a country"
              />
              <Button
                fullWidth
                size="lg"
                onClick={handleNext}
                disabled={!country}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 2: City */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Select
                label="Select your City"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setArea('');
                }}
                options={getCitiesForCountry(country).map((c) => ({
                  value: c.name,
                  label: c.name,
                }))}
                placeholder="Choose a city"
              />
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleNext}
                  disabled={!city}
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Area */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Select
                label="Select your Area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                options={getAreasForCity(country, city).map((a) => ({
                  value: a.name,
                  label: a.name,
                }))}
                placeholder="Choose an area"
              />
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleComplete}
                  disabled={!area || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Complete Setup
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AuthGuard>
  );
}
