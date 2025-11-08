for i in range (1,count+1):
  PlayQuizID=random.randint(1,int(Quiz_answer.__len__()))
  QUIZ={
    1:Quiz[PlayQuizID],
    2:Quiz_answer[PlayQuizID],
    3:Quiz_point[PlayQuizID],
  }
  print(QUIZ[1])
  answer=""        
  allpoint+=QUIZ[3]
  while (answer=="" or answer=="/playcommand") :
    answer=input("答えを入力")
      if answer=="" :
          continue

      if answer=="/playcommand" :
          answer=""
          answer=input("""
コマンドを入力。/playcommand command_name object で実行可能です。
/playcommand help all で現在利用可能なコマンドが表示されます。""") 
      if answer=="/playcommand help all" : 
          print("\n")
          print("Command Help V.0.0.0\n")
          print("現在利用可能コマンド一覧\n")
          print("/playcommand\nコマンド実行のために一番最初に入力する。コマンド入力時に入力しても何も起こらない。\n")
          print("/playcommand help all\nコマンドヘルプを出すために必要。現在allのオブジェクトに文字を入れて検索できるようにしたい。\n")
          print("/playcommand question view\n問題を再表示するために必要。改行押しすぎて問題が見えなくなった時いいかも。\n")
                
      if answer=="/playcommand question view":
          print(QUIZ[1])
      
      answer="/playcommand"
      continue

      if answer==QUIZ[2]:
          clearcount+=1
          point+=QUIZ[3]
          print(f"""正解!!\n+{QUIZ[3]}pt\n\n""")
      else:
          print("残念...\n\n")
