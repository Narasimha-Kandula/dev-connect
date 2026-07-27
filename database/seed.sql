-- Sample skills seed — run after schema.sql
insert into skills (name) values
  ('React'), ('Next.js'), ('TypeScript'), ('Node.js'), ('NestJS'),
  ('Python'), ('Django'), ('Go'), ('Rust'), ('PostgreSQL'),
  ('MongoDB'), ('GraphQL'), ('Docker'), ('Kubernetes'), ('AWS'),
  ('AI/ML'), ('TensorFlow'), ('React Native'), ('Flutter'), ('Solidity')
on conflict (name) do nothing;
