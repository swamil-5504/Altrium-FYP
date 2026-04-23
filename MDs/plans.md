Noted on the wizard flow — upload first, then template. For the other three, what would you like to
   clarify first? Some things you might want to discuss:                                             
                                                                                                     
  - Bulk minting — you've never said whether a contract redeploy is acceptable. The trade-off is     
  one-signature UX vs. having to handle a split-contract migration (old degrees on v1 address, new on
   v2). Are you open to redeploy, and if so, how should EmployerVerify behave for legacy addresses?  
  - Devanagari in PDF — are real pilot universities going to issue Marathi/Hindi-name certificates,  
  or is Devanagari mostly a UI-side need (dashboards, forms)? If the PDF doesn't need Devanagari in  
  v1, we can keep reportlab and skip the engine swap entirely.                                       
  - Email provider — do you already have an AWS account, a domain with DNS control, or a preferred   
  vendor? The "right" answer here is mostly about what's easiest for you to operationalise, not      
  technical.                                                                                         
                                                                                                     
  Tell me what you want to dig into — specific concerns, preferences, or constraints I don't know —  
  and I'll reformulate sharper questions around those. 