/**
 * Medical Certificate Validity & Interruption Engine (v2)
 * Grounded in MCAR / CAAM Regulations and OM-A Policies
 * 
 * Excludes:
 * - Operational Status & Duty Clearance Results (evaluateOperationalStatus)
 */

class MedicalValidityEngine {
  /**
   * Calculates the medical certificate validity and new expiry date.
   * 
   * @param {Object} params
   * @param {string|Date} params.dob - Pilot Date of Birth (YYYY-MM-DD or Date)
   * @param {string|Date} params.examDate - Date of medical examination
   * @param {string|Date} [params.currentExpiryDate] - Current medical expiry date (if renewing)
   * @returns {Object} Calculation results including age, validity months, new expiry date, anniversary preserved flag.
   */
  static calculateValidity({ dob, examDate, currentExpiryDate = null }) {
    const dobDate = new Date(dob);
    const exam = new Date(examDate);
    
    if (isNaN(dobDate.getTime()) || isNaN(exam.getTime())) {
      throw new Error("Invalid date provided for DOB or Examination Date.");
    }

    // 1. Calculate Age at time of examination
    const age = this.calculateAge(dobDate, exam);

    // Hard Age Ceiling Check
    if (age >= 65) {
      return {
        age,
        isEligible: false,
        reason: "Commercial Air Transport pilot privileges cease at Age 65.",
        validityMonths: 0,
        newExpiryDate: null
      };
    }

    // 2. Determine Validity Duration (12 months < Age 60; 6 months >= Age 60)
    const validityMonths = (age >= 60) ? 6 : 12;

    let baseDate = new Date(exam);
    let anniversaryPreserved = false;

    // 3. Apply 45-Day Window Rule if existing expiry date is provided
    if (currentExpiryDate) {
      const currentExpiry = new Date(currentExpiryDate);
      if (!isNaN(currentExpiry.getTime())) {
        const diffTime = currentExpiry.getTime() - exam.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If exam is conducted within 45 days prior to current expiry
        if (diffDays >= 0 && diffDays <= 45) {
          baseDate = new Date(currentExpiry);
          anniversaryPreserved = true;
        }
      }
    }

    // 4. Calculate New Expiry Date
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + validityMonths);

    return {
      age,
      isEligible: true,
      validityMonths,
      anniversaryPreserved,
      examDate: exam.toISOString().split('T')[0],
      newExpiryDate: newExpiryDate.toISOString().split('T')[0],
      restrictions: age >= 60 ? ["Multi-pilot crew operations only (Single-pilot prohibited)"] : []
    };
  }

  /**
   * Assesses medical interruption, anaesthetics, and accident grounding buffers.
   * 
   * @param {Object} params
   * @param {number} [params.absenceDays=0] - Continuous medical leave / illness duration in days
   * @param {string} [params.anaestheticType='none'] - 'none', 'local', or 'general_spinal'
   * @param {boolean} [params.hadAccident=false] - Whether pilot was involved in an accident/incident
   * @returns {Object} Clearance requirements and minimum grounding hours.
   */
  static evaluateInterruptionClearance({ absenceDays = 0, anaestheticType = 'none', hadAccident = false }) {
    const requirements = [];
    let minimumGroundingHours = 0;
    let RequiresDFOClearance = false;

    if (absenceDays > 45) {
      RequiresDFOClearance = true;
      requirements.push("Operational Check Flight and formal clearance from Director of Flight Operations (DFO) required due to absence > 45 days.");
    }

    if (anaestheticType === 'local') {
      minimumGroundingHours = Math.max(minimumGroundingHours, 12);
      requirements.push("Mandatory 12-hour grounding buffer post-local anaesthetic.");
    } else if (anaestheticType === 'general_spinal') {
      minimumGroundingHours = Math.max(minimumGroundingHours, 48);
      requirements.push("Mandatory 48-hour grounding buffer post-general/spinal anaesthetic.");
    }

    if (hadAccident) {
      requirements.push("Mandatory medical examination required following aircraft accident/incident.");
    }

    return {
      clearedForLineDuty: requirements.length === 0,
      RequiresDFOClearance,
      minimumGroundingHours,
      requirements
    };
  }

  /**
   * Helper function to calculate exact age in years
   */
  static calculateAge(birthDate, referenceDate) {
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}

// Node.js module export compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MedicalValidityEngine;
}

export { MedicalValidityEngine }; 
export function calculateMedicalValidity(params) { 
  return MedicalValidityEngine.calculateValidity(params); 
}
