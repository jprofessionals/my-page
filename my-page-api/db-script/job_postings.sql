-- Insert example data into job_posting table
INSERT INTO job_posting (customer, description, due_date_for_application, location, required_years_of_experience,
                         resources_needed, title)
VALUES ('NAV',
        'Hei,\nVi trenger en senior backendutvikler til PO pensjon, helst 5års+ erfaring, men 4 år funker dersom konsulenten er veldig dyktig.\Teamet er fleksible mtp på oppstart.',
        '2023-04-10',
        'Oslo',
        1,
        5,
        'Erstatter - senior backend til PO pensjon');

INSERT INTO job_posting (customer, description, due_date_for_application, location, required_years_of_experience,
                         resources_needed, title)
VALUES ('Skatteetaten',
        'Hei,\nSkatteetaten har behov for å øke kapasiteten primært på frontend kompetanse, og da særskilt å sørge for at deres publikumsløsninger, men også interne saksbehandlingsløsninger tilfredsstiller krav til UU og er helhetlig integrert mot vårt designsystem.',
        '2028-04-10',
        'Helsfyr',
        1,
        5,
        'Utvikler Skatteprosess');

-- Insert example data into tags table
INSERT INTO tags (name)
VALUES ('Java');
INSERT INTO tags (name)
VALUES ('Kotlin');
INSERT INTO tags (name)
VALUES ('Kafka');
INSERT INTO tags (name)
VALUES ('JavaScript');
INSERT INTO tags (name)
VALUES ('React');
INSERT INTO tags (name)
VALUES ('TypeScript');

-- Assume that the example data inserted above are the first records in each table, so their IDs are 1. Now, insert example data into job_posting_tags table
INSERT INTO job_posting_tags (job_posting_id, tag_id)
VALUES (1, 1);
INSERT INTO job_posting_tags (job_posting_id, tag_id)
VALUES (1, 2);
INSERT INTO job_posting_tags (job_posting_id, tag_id)
VALUES (1, 3);

INSERT INTO job_posting_tags (job_posting_id, tag_id)
VALUES (2, 4);
INSERT INTO job_posting_tags (job_posting_id, tag_id)
VALUES (2, 5);
INSERT INTO job_posting_tags (job_posting_id, tag_id)
VALUES (2, 6);
