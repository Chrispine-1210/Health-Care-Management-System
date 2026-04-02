# Pharmacist User Guide - Thandizo Pharmacy

## Overview
This guide explains how pharmacists can use the Thandizo Pharmacy Management System to review and manage prescriptions, track inventory, and process customer orders.

---

## Getting Started - Accessing the Pharmacist Portal

### 1. Initial Login
- Click **"Shop Medications"** on the landing page
- Complete Replit authentication (one-time)
- You'll be logged in as a **Customer** by default

### 2. Switching to Pharmacist Role (Development/Testing)
- Navigate to `/role-tester` in your browser
- Click the **"Pharmacist"** role card
- Click **"Switch to Pharmacist"** button
- The app will refresh and reload with pharmacist access
- You'll see the **Pharmacist Dashboard** after reload

---

## Pharmacist Dashboard

### Location: `/pharmacist` or `/pharmacist/dashboard`

The main pharmacist dashboard displays key metrics and quick access to critical functions:

**Dashboard Cards:**

1. **Pending Review** 
   - Shows count of prescriptions awaiting pharmacist review
   - Action: Click to go to Prescription Review Queue

2. **Reviewed Today**
   - Tracks prescriptions you've processed during your shift
   - Updated when you approve or reject prescriptions

3. **Stock Alerts**
   - Displays count of medications running low on inventory
   - Critical for stock management and reordering

4. **Consultations**
   - Shows scheduled pharmacy consultations for today
   - For customer health consultations with pharmacists

---

## Prescription Review Workflow

### Location: `/pharmacist/prescriptions`

This is where pharmacists review and process customer prescriptions.

### Step-by-Step Process:

#### 1. **View Pending Prescriptions**
   - All prescriptions awaiting review are listed
   - Each prescription shows:
     - Prescription ID (truncated)
     - Date and time submitted
     - Current status badge (Pending, Under Review, Approved, Rejected, Dispensed)

#### 2. **Search Prescriptions**
   - Use the search box to find specific prescriptions by ID
   - Filters list in real-time as you type

#### 3. **Review a Prescription**
   - Click the **"Review"** button on any prescription
   - This opens the detailed prescription review page

#### 4. **Detailed Prescription Review** (`/pharmacist/prescriptions/:id`)
   - **View Complete Details:**
     - Patient information (name, contact, medical history)
     - Medication details (name, dosage, frequency, duration)
     - Prescriber information (doctor name, contact)
     - Prescription notes and special instructions
   
   - **Approve Prescription:**
     - Review medication for potential interactions
     - Verify patient allergies and medical conditions
     - Click **"Approve"** button
     - Prescription moves to "Approved" status
     - Pharmacy staff is notified to prepare medication
   
   - **Reject Prescription:**
     - If medication is contraindicated or patient has allergies
     - Click **"Reject"** button
     - Add reason for rejection (displayed to patient and prescriber)
     - Prescription moves to "Rejected" status
     - Patient receives notification to contact doctor

---

## Key Pharmacist Features

### 1. **Prescription Processing**
   - Review prescriptions submitted by customers or healthcare providers
   - Check for drug interactions using integrated system
   - Verify patient medical history (allergies, chronic conditions)
   - Approve or reject based on clinical assessment

### 2. **Inventory Management**
   - View low stock alerts
   - Track medication availability before approving prescriptions
   - Coordinate with admin for stock replenishment

### 3. **Clinical Consultation**
   - Schedule consultations with customers
   - Provide medication counseling
   - Track consultation history

### 4. **Order Management**
   - View customer orders containing approved prescriptions
   - Track dispensing status (pending → confirmed → processing → ready → picked up → delivered)
   - Generate dispensing labels and instructions

---

## Prescription Status Reference

| Status | Meaning | Action |
|--------|---------|--------|
| **Pending** | Awaiting pharmacist review | Review and approve/reject |
| **Under Review** | Pharmacist is currently reviewing | Being processed |
| **Approved** | Approved by pharmacist, ready for fulfillment | Pharmacy prepares medication |
| **Rejected** | Rejected by pharmacist with reason | Customer must contact prescriber |
| **Dispensed** | Medication prepared and ready for pickup | Ready for customer collection |

---

## Workflow Summary

```
1. Customer submits prescription or doctor uploads prescription
        ↓
2. Prescription appears in "Pending Review" queue
        ↓
3. Pharmacist navigates to /pharmacist/prescriptions
        ↓
4. Pharmacist searches and clicks "Review" on prescription
        ↓
5. Pharmacist reviews patient info, allergies, medication details
        ↓
6. Pharmacist:
   - Approves (if no issues) → Pharmacy staff prepares medication
   - Rejects (if contraindicated) → Customer notified, doctor contacted
        ↓
7. Approved prescriptions appear in customer orders
        ↓
8. Pharmacy staff marks as ready for pickup
        ↓
9. Customer picks up medication
```

---

## Tips for Pharmacists

✓ **Check patient allergies** before approving any medication
✓ **Review drug interactions** using the integrated system
✓ **Verify chronic conditions** that might contraindicate medications
✓ **Keep notes** for complex cases requiring follow-up
✓ **Monitor stock alerts** to avoid approving unavailable medications
✓ **Communicate with prescribers** about rejected prescriptions
✓ **Schedule consultations** for complex medication regimens

---

## Role Access

**Only pharmacists can access:**
- `/pharmacist/dashboard`
- `/pharmacist/prescriptions`
- `/pharmacist/prescriptions/:id` (detailed review)

**If you're not a pharmacist:**
1. Go to `/role-tester` (development environment)
2. Click "Pharmacist" card
3. Click "Switch to Pharmacist"
4. The system will reload with pharmacist access

---

## Troubleshooting

**Can't see prescriptions?**
- Make sure you've switched to pharmacist role
- Check that prescriptions have been submitted to the system
- Refresh the page if needed

**Approval button not working?**
- Verify you have pharmacist role (check role badge in top-left)
- Check your internet connection
- Try refreshing the page

**Patient data not showing?**
- Patient information is loaded with prescription details
- If missing, there may be a data sync issue
- Contact system administrator

---

## Support

For additional features or issues, contact:
- **System Admin:** [admin@thandiozpharmacy.mw]
- **Technical Support:** [support@thandiozpharmacy.mw]

---

**Version:** 1.0 | **Last Updated:** November 2025 | **Thandizo Pharmacy Management System**
