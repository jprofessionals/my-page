export interface JobPostingType {
  id: string
  title: string
  customer: string
  deadline: Date
  tags: string[]
  description: string
  files: string[]
  links: string[]
}
