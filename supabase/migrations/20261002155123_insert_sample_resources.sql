/*
# Insert sample resource data

Adds 10 realistic demo resources so the app is immediately functional.
One resource (Scientific Calculator) is pre-set to Borrowed for demonstration.
*/

INSERT INTO resources (name, category, description, owner_name, owner_id, owner_contact, condition, availability_status, borrower_name, borrower_id, borrowed_at, expected_return_date) VALUES
  ('Database Management Systems Textbook', 'Books', 'Comprehensive DBMS textbook covering ER diagrams, normalization, SQL, transactions, and indexing. Great for exam preparation.', 'Priya Sharma', 'CS21B001', 'priya.s@campus.edu', 'Good', 'Available', NULL, NULL, NULL, NULL),
  ('Java Programming Textbook', 'Books', 'Complete Java programming guide covering OOP, collections, multithreading, and JDBC. Includes practice exercises.', 'Arjun Mehta', 'CS21B002', 'arjun.m@campus.edu', 'Good', 'Available', NULL, NULL, NULL, NULL),
  ('Scientific Calculator (Casio fx-991EX)', 'Calculators', 'Scientific calculator with 552 functions, ideal for engineering mathematics, statistics, and calculus.', 'Riya Patel', 'EC21B003', 'riya.p@campus.edu', 'Fair', 'Borrowed', 'Karan Singh', 'ME22B015', now() - interval '2 days', (now() + interval '5 days')::date),
  ('Arduino Uno Rev3', 'Electronics', 'Arduino Uno microcontroller board with USB cable. Perfect for IoT and embedded systems projects.', 'Vikram Reddy', 'EC21B004', 'vikram.r@campus.edu', 'Good', 'Available', NULL, NULL, NULL, NULL),
  ('HDMI to VGA Adapter', 'Electronics', 'HDMI to VGA adapter for connecting laptops to older projectors and monitors. Useful for presentations.', 'Sneha Iyer', 'IT21B005', 'sneha.i@campus.edu', 'New', 'Available', NULL, NULL, NULL, NULL),
  ('Computer Networks Textbook', 'Books', 'Networking textbook covering OSI model, TCP/IP, routing, and network security. By Tanenbaum.', 'Dhruv Gupta', 'CS21B006', 'dhruv.g@campus.edu', 'Good', 'Available', NULL, NULL, NULL, NULL),
  ('Lab Coat (Size L)', 'Lab Equipment', 'White lab coat for chemistry and biology lab sessions. freshly washed and in good condition.', 'Ananya Nair', 'BT21B007', 'ananya.n@campus.edu', 'Good', 'Available', NULL, NULL, NULL, NULL),
  ('Engineering Drawing Kit', 'Stationery', 'Complete drawing kit with compass, protractor, set squares, scales, and French curves for engineering graphics.', 'Rohan Das', 'ME21B008', 'rohan.d@campus.edu', 'Used', 'Available', NULL, NULL, NULL, NULL),
  ('DBMS Handwritten Notes', 'Study Materials', 'Detailed handwritten notes covering all DBMS topics including ACID properties, normal forms, and practice questions.', 'Priya Sharma', 'CS21B001', 'priya.s@campus.edu', 'Fair', 'Available', NULL, NULL, NULL, NULL),
  ('Java Practice Workbook', 'Study Materials', 'Java practice book with 200+ coding problems, solutions, and interview questions. Great for hands-on practice.', 'Arjun Mehta', 'CS21B002', 'arjun.m@campus.edu', 'Good', 'Available', NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;
