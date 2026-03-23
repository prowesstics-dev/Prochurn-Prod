// src/utils/ssbiTourShepherd.js
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

let tour = null;

export function initSSBITour() {
  if (tour) return tour;

  tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: {
        enabled: false
      },
      scrollTo: { behavior: 'smooth', block: 'center' },
      when: {
        show() {
          // Customize the modal overlay for better spotlight effect
          const overlay = document.querySelector('.shepherd-modal-overlay-container');
          if (overlay) {
            overlay.style.pointerEvents = 'none';
            // Make overlay darker for better contrast
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          }
          
          // Ensure the highlighted element is interactive
          const currentElement = document.querySelector(this.options.attachTo.element);
          if (currentElement) {
            currentElement.style.pointerEvents = 'auto';
            currentElement.style.position = 'relative';
            currentElement.style.zIndex = '10001';
          }
        },
        hide() {
          // Reset element styles when hiding step
          const currentElement = document.querySelector(this.options.attachTo.element);
          if (currentElement) {
            currentElement.style.pointerEvents = '';
            currentElement.style.position = '';
            currentElement.style.zIndex = '';
          }
        }
      }
    }
  });

  // Step 1: Template Selection - Focus on Template 1 grid
  tour.addStep({
    title: 'Step 1 - Choose Template',
    text: 'Click on Template 1 to load the Executive Grid Design. This template provides high-level KPIs and key metrics overview.',
    attachTo: {
      element: '#template-executive', // Make sure this ID matches your Template 1 container
      on: 'top'
    },
    buttons: [],
    id: 'step-1',
    modalOverlayOpeningPadding: 10, // Add padding around highlighted element
    modalOverlayOpeningRadius: 8    // Rounded corners for highlight
  });

  // Step 2: Table Dropdown
  tour.addStep({
    title: 'Step 2',
    text: 'Click here to open the table selector.',
    attachTo: {
      element: '#table-dropdown',
      on: 'bottom'
    },
    buttons: [],
    id: 'step-2'
  });

  // Step 3: Select Table
  tour.addStep({
    title: 'Step 3',
    text: 'Click on the first table to load data.',
    attachTo: {
      element: '#table-option-1',
      on: 'bottom'
    },
    buttons: [],
    id: 'step-3'
  });

  // Step 4: Toggle Columns
  tour.addStep({
    title: 'Step 4',
    text: 'Click Columns button to open column list.',
    attachTo: {
      element: '#toggle-columns',
      on: 'bottom'
    },
    buttons: [],
    id: 'step-4'
  });

  // Step 5: Drag Column
  tour.addStep({
    title: 'Step 5',
    text: 'Drag this column to a KPI card.',
    attachTo: {
      element: '.draggable-column:first-child',
      on: 'right'
    },
    buttons: [],
    id: 'step-5'
  });

  // Step 6: Drop Zone
  tour.addStep({
    title: 'Step 6',
    text: 'Drop the column here to populate KPI.',
    attachTo: {
      element: '.kpi-dropzone:first-child',
      on: 'top'
    },
    buttons: [],
    id: 'step-6'
  });

  // Step 7: Aggregation
  tour.addStep({
    title: 'Step 7',
    text: 'Choose the aggregation method for the KPI.',
    attachTo: {
      element: '#kpi-aggregation',
      on: 'top'
    },
    buttons: [],
    id: 'step-7'
  });

  // Step 8: Finalize KPI
  tour.addStep({
    title: 'Step 8',
    text: 'Click this button to finalize your KPI.',
    attachTo: {
      element: '#set-kpi-button',
      on: 'top'
    },
    buttons: [
      {
        text: 'Finish Tour',
        action() {
          return this.complete();
        }
      }
    ],
    id: 'step-8'
  });

  return tour;
}

export function startSSBITour() {
  const tourInstance = initSSBITour();
  if (!tourInstance) return;
  
  tourInstance.start();

  // Bind events to advance tour manually
  setTimeout(() => {
    const templateBtn = document.getElementById('template-executive');
    const tableDropdown = document.getElementById('table-dropdown');
    const tableOption = document.getElementById('table-option-1');
    const toggleColumns = document.getElementById('toggle-columns');
    const draggableColumn = document.querySelector('.draggable-column:first-child');
    const kpiDropzone = document.querySelector('.kpi-dropzone:first-child');
    const kpiAggregation = document.getElementById('kpi-aggregation');
    const setKpiButton = document.getElementById('set-kpi-button');

    if (templateBtn) {
      templateBtn.addEventListener('click', () => tourInstance.next(), { once: true });
    }

    if (tableDropdown) {
      tableDropdown.addEventListener('click', () => tourInstance.next(), { once: true });
    }

    if (tableOption) {
      tableOption.addEventListener('click', () => tourInstance.next(), { once: true });
    }

    if (toggleColumns) {
      toggleColumns.addEventListener('click', () => tourInstance.next(), { once: true });
    }

    if (draggableColumn) {
      draggableColumn.addEventListener('dragstart', () => {
        if (kpiDropzone) {
          kpiDropzone.addEventListener('drop', () => tourInstance.next(), { once: true });
        }
      }, { once: true });
    }

    if (kpiAggregation) {
      kpiAggregation.addEventListener('change', () => tourInstance.next(), { once: true });
    }

    if (setKpiButton) {
      setKpiButton.addEventListener('click', () => tourInstance.complete(), { once: true });
    }
  }, 500);
}

export function moveTourNext() {
  if (tour) tour.next();
}

export function resetSSBITour() {
  if (tour) {
    // Clean up tour styles
    document.body.classList.remove('shepherd-active');
    
    // Remove any focus classes
    document.querySelectorAll('.template-focused, .tour-highlight-element').forEach(el => {
      el.classList.remove('template-focused', 'tour-highlight-element');
    });
    
    tour.complete();
    tour = null;
  }
}