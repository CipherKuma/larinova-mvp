'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverAnchor
} from '@/components/ui/popover';
import {
  Home,
  Users,
  Stethoscope,
  CheckSquare,
  FileText,
  Globe,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const tourSteps = [
  {
    id: 'home',
    icon: Home,
    titleKey: 'tour.home.title',
    descriptionKey: 'tour.home.description',
    selector: '[data-tour="home"]',
    position: 'right' as const,
  },
  {
    id: 'patients',
    icon: Users,
    titleKey: 'tour.patients.title',
    descriptionKey: 'tour.patients.description',
    selector: '[data-tour="patients"]',
    position: 'right' as const,
  },
  {
    id: 'consultations',
    icon: Stethoscope,
    titleKey: 'tour.consultations.title',
    descriptionKey: 'tour.consultations.description',
    selector: '[data-tour="consultations"]',
    position: 'right' as const,
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    titleKey: 'tour.tasks.title',
    descriptionKey: 'tour.tasks.description',
    selector: '[data-tour="tasks"]',
    position: 'right' as const,
  },
  {
    id: 'documents',
    icon: FileText,
    titleKey: 'tour.documents.title',
    descriptionKey: 'tour.documents.description',
    selector: '[data-tour="documents"]',
    position: 'right' as const,
  },
  {
    id: 'language',
    icon: Globe,
    titleKey: 'tour.language.title',
    descriptionKey: 'tour.language.description',
    selector: '[data-tour="language"]',
    position: 'right' as const,
  },
];

interface TourGuideProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function TourGuide({ isOpen, onComplete }: TourGuideProps) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorPosition, setAnchorPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (isOpen && currentStep < tourSteps.length) {
      // Find the target element
      const element = document.querySelector(tourSteps[currentStep].selector) as HTMLElement;
      if (element) {
        setTargetElement(element);

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight the element
        element.style.position = 'relative';
        element.style.zIndex = '1000';

        // Update anchor position
        const updatePosition = () => {
          const rect = element.getBoundingClientRect();
          setAnchorPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        };

        updatePosition();

        // Open popover after a short delay to allow for scrolling
        setTimeout(() => {
          updatePosition();
          setPopoverOpen(true);
        }, 300);
      }
    } else if (!isOpen) {
      cleanupHighlight();
    }
  }, [currentStep, isOpen]);

  const cleanupHighlight = () => {
    if (targetElement) {
      targetElement.style.position = '';
      targetElement.style.zIndex = '';
    }
  };

  const handleNext = () => {
    cleanupHighlight();
    setPopoverOpen(false);

    if (currentStep < tourSteps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 200);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      cleanupHighlight();
      setPopoverOpen(false);
      setTimeout(() => setCurrentStep(currentStep - 1), 200);
    }
  };

  const handleSkip = () => {
    cleanupHighlight();
    setPopoverOpen(false);
    onComplete();
  };

  const handleComplete = () => {
    cleanupHighlight();
    setPopoverOpen(false);
    onComplete();
  };

  if (!isOpen || !targetElement) {
    return null;
  }

  const step = tourSteps[currentStep];
  const Icon = step.icon;

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {popoverOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[999]"
            onClick={handleSkip}
          />
        )}
      </AnimatePresence>

      {/* Tour popover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverAnchor
          style={{
            position: 'absolute',
            left: anchorPosition.left,
            top: anchorPosition.top,
            width: anchorPosition.width,
            height: anchorPosition.height,
          }}
        />
        <PopoverContent
          side={step.position}
          className="w-80 z-[1001] p-0 overflow-hidden"
          sideOffset={20}
        >
          <div className="bg-muted p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2.5 rounded-lg">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentStep + 1} / {tourSteps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              {t(step.descriptionKey)}
            </p>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-4">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-primary'
                      : index < currentStep
                      ? 'bg-primary/50'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <Button
                onClick={handlePrevious}
                variant="outline"
                size="sm"
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('common.previous')}
              </Button>
              <Button
                onClick={handleNext}
                size="sm"
                className="flex-1"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1" />
                    {t('common.finish')}
                  </>
                ) : (
                  <>
                    {t('common.next')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>

            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
            >
              {t('tour.skipTour')}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
