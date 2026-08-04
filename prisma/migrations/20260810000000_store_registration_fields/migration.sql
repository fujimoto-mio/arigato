-- Store registration contact details + terms-agreement record. All nullable so
-- existing stores remain valid; the registration form enforces which are required.
ALTER TABLE "Store"
  ADD COLUMN "companyName"   TEXT,
  ADD COLUMN "contactName"   TEXT,
  ADD COLUMN "phone"         TEXT,
  ADD COLUMN "email"         TEXT,
  ADD COLUMN "address"       TEXT,
  ADD COLUMN "termsAgreedAt" TIMESTAMPTZ(3);
