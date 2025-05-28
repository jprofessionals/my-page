import moment from 'moment'
import getInNok from '@/utils/getInNok'

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: any
}
const Post = ({ post }: Props) => {

  const checkDateOfDeduction = () => {
    if (post.dateOfDeduction) {
      // Check if dateOfDeduction exists and is not null
      return (
        <div className="flex flex-col">
          <b>Trekkdato:</b> {moment(post.dateOfDeduction).format('DD.MM.YYYY')}
        </div>
      )
    } else {
      // Handle the case when dateOfDeduction is null or undefined
      return
    }
  }

  return (
    <div className="overflow-hidden w-full rounded-xl border-2 border-gray-500 border-solid shadow-xs">
      <div className="flex justify-between items-center p-3 pb-2 w-full text-sm bg-gray-200">
        <span className="flex gap-2 items-center p-1">
          {post.description}
        </span>
      </div>
      <div className="flex flex-col p-3">
        <b>Pris:</b> {getInNok(post.amountExMva)}
        <b>Dato:</b> {moment(post.date).format('DD.MM.YYYY')}
        {checkDateOfDeduction()}
      </div>
    </div>
  )
}

export default Post
