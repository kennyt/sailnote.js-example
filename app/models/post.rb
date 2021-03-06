class Post < ActiveRecord::Base
  attr_accessible :title, :text, :published, :published_date, :url
  validates :user_id, presence: true
  validates :title, uniqueness: { case_sensitive: false, scope: :user_id }, presence: true
  validates :url, uniqueness: { case_sensitive: false, scope: :user_id }
  belongs_to :user

   def to_param
    title.split(' ').join('-') if title
  end

  def self.find(input)
  	input = input.gsub('-',' ')
    input.to_i == 0 ? find_by_url(input) : super
  end

  def uniquify_all
    Post.all.each{ |post|
      post.update_attribute(:url,post.title.gsub(' ','-').downcase)
    }
  end

end
